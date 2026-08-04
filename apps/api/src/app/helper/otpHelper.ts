import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import config from "../config";
import { getRedis } from "../shared/redis";

export type OtpPurpose = "email_verification" | "password_reset" | "phone";
export type OtpVerificationResult =
  | { status: "valid" }
  | { status: "invalid"; attemptsRemaining: number }
  | { status: "expired" }
  | { status: "locked" };

type OtpRecord = {
  digest: string;
  attempts: number;
  expiresAt: number;
};

type MemoryEntry = { value: string; expiresAt: number };

const memoryStore = new Map<string, MemoryEntry>();

export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 5 * 60;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;
export const RESET_GRANT_TTL_SECONDS = 10 * 60;

const normalizeIdentifier = (identifier: string) =>
  identifier.trim().toLowerCase();

const identifierHash = (identifier: string) =>
  createHash("sha256").update(normalizeIdentifier(identifier)).digest("hex");

const keyFor = (kind: string, purpose: OtpPurpose, identifier: string) =>
  `auth:${kind}:${purpose}:${identifierHash(identifier)}`;

const otpSecret =
  config.jwt.jwt_pass_reset_secret ||
  config.jwt.jwt_access_secret ||
  "development-only-otp-secret";

const digestValue = (
  value: string,
  purpose: OtpPurpose,
  identifier: string,
) =>
  createHmac("sha256", otpSecret)
    .update(`${purpose}:${normalizeIdentifier(identifier)}:${value}`)
    .digest("hex");

const safeEqualHex = (left: string, right: string) => {
  try {
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  } catch {
    return false;
  }
};

const getMemory = (key: string): string | null => {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
};

const setMemory = (key: string, value: string, ttlSeconds: number) => {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

const ttlMemory = (key: string) => {
  const entry = memoryStore.get(key);
  if (!entry) return -2;
  const ttl = Math.ceil((entry.expiresAt - Date.now()) / 1000);
  if (ttl <= 0) {
    memoryStore.delete(key);
    return -2;
  }
  return ttl;
};

const OTP_SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const sweepInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(key);
  }
}, OTP_SWEEP_INTERVAL_MS);
sweepInterval.unref?.();

const generateOtp = () =>
  randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");

const consumeResetGrantScript = `
local value = redis.call('GET', KEYS[1])
if not value then return 0 end
if value ~= ARGV[1] then return -1 end
redis.call('DEL', KEYS[1])
return 1
`;

export const otpHelper = {
  async issueOtp(
    identifier: string,
    purpose: OtpPurpose,
  ): Promise<{
    otp: string;
    expiresIn: number;
    resendAvailableIn: number;
  }> {
    const otpKey = keyFor("otp", purpose, identifier);
    const cooldownKey = keyFor("otp-cooldown", purpose, identifier);
    const redis = await getRedis();

    if (redis) {
      const cooldownTtl = await redis.ttl(cooldownKey);
      if (cooldownTtl > 0) {
        const error = new Error("OTP_COOLDOWN") as Error & {
          retryAfter?: number;
        };
        error.retryAfter = cooldownTtl;
        throw error;
      }
    } else {
      const cooldownTtl = ttlMemory(cooldownKey);
      if (cooldownTtl > 0) {
        const error = new Error("OTP_COOLDOWN") as Error & {
          retryAfter?: number;
        };
        error.retryAfter = cooldownTtl;
        throw error;
      }
    }

    const otp = generateOtp();
    const record: OtpRecord = {
      digest: digestValue(otp, purpose, identifier),
      attempts: 0,
      expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
    };

    if (redis) {
      await redis
        .multi()
        .set(otpKey, JSON.stringify(record), { EX: OTP_TTL_SECONDS })
        .set(cooldownKey, "1", { EX: OTP_RESEND_COOLDOWN_SECONDS })
        .exec();
    } else {
      setMemory(otpKey, JSON.stringify(record), OTP_TTL_SECONDS);
      setMemory(cooldownKey, "1", OTP_RESEND_COOLDOWN_SECONDS);
    }

    return {
      otp,
      expiresIn: OTP_TTL_SECONDS,
      resendAvailableIn: OTP_RESEND_COOLDOWN_SECONDS,
    };
  },

  async getResendCooldown(
    identifier: string,
    purpose: OtpPurpose,
  ): Promise<number> {
    const key = keyFor("otp-cooldown", purpose, identifier);
    const redis = await getRedis();
    const ttl = redis ? await redis.ttl(key) : ttlMemory(key);
    return Math.max(0, ttl);
  },

  async verifyOtp(
    identifier: string,
    purpose: OtpPurpose,
    otp: string,
  ): Promise<OtpVerificationResult> {
    const key = keyFor("otp", purpose, identifier);
    const redis = await getRedis();
    const raw = redis ? await redis.get(key) : getMemory(key);
    if (!raw) return { status: "expired" };

    let record: OtpRecord;
    try {
      record = JSON.parse(raw) as OtpRecord;
    } catch {
      if (redis) await redis.del(key);
      else memoryStore.delete(key);
      return { status: "expired" };
    }

    if (record.expiresAt <= Date.now()) {
      if (redis) await redis.del(key);
      else memoryStore.delete(key);
      return { status: "expired" };
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      return { status: "locked" };
    }

    const suppliedDigest = digestValue(otp, purpose, identifier);
    if (!safeEqualHex(record.digest, suppliedDigest)) {
      record.attempts += 1;
      const remaining = Math.max(0, OTP_MAX_ATTEMPTS - record.attempts);
      const remainingTtl = Math.max(
        1,
        Math.ceil((record.expiresAt - Date.now()) / 1000),
      );
      if (redis) {
        await redis.set(key, JSON.stringify(record), { EX: remainingTtl });
      } else {
        setMemory(key, JSON.stringify(record), remainingTtl);
      }
      return remaining === 0
        ? { status: "locked" }
        : { status: "invalid", attemptsRemaining: remaining };
    }

    if (redis) await redis.del(key);
    else memoryStore.delete(key);
    return { status: "valid" };
  },

  async invalidateOtp(identifier: string, purpose: OtpPurpose): Promise<void> {
    const key = keyFor("otp", purpose, identifier);
    const redis = await getRedis();
    if (redis) await redis.del(key);
    else memoryStore.delete(key);
  },

  async createResetGrant(identifier: string): Promise<string> {
    const token = randomBytes(32).toString("base64url");
    const key = keyFor("reset-grant", "password_reset", identifier);
    const digest = digestValue(token, "password_reset", identifier);
    const redis = await getRedis();
    if (redis) await redis.set(key, digest, { EX: RESET_GRANT_TTL_SECONDS });
    else setMemory(key, digest, RESET_GRANT_TTL_SECONDS);
    return token;
  },

  async consumeResetGrant(identifier: string, token: string): Promise<boolean> {
    const key = keyFor("reset-grant", "password_reset", identifier);
    const suppliedDigest = digestValue(token, "password_reset", identifier);
    const redis = await getRedis();

    if (redis) {
      const result = await redis.eval(consumeResetGrantScript, {
        keys: [key],
        arguments: [suppliedDigest],
      });
      return Number(result) === 1;
    }

    const storedDigest = getMemory(key);
    if (!storedDigest || !safeEqualHex(storedDigest, suppliedDigest)) {
      return false;
    }
    memoryStore.delete(key);
    return true;
  },
};
