import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.join(process.cwd(), ".env") });

// Vars the app cannot safely run without. Validated once, at boot, so a
// misconfigured deployment fails immediately and obviously — not on
// whatever request first happens to touch the missing value.
const requiredEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_ACCESS_EXPIRES: z.string().min(1, "JWT_ACCESS_EXPIRES is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_REFRESH_EXPIRES: z.string().min(1, "JWT_REFRESH_EXPIRES is required"),
  JWT_PASS_RESET_SECRET: z
    .string()
    .min(1, "JWT_PASS_RESET_SECRET is required"),
  JWT_PASS_RESET_EXPIRES: z
    .string()
    .min(1, "JWT_PASS_RESET_EXPIRES is required"),
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required (used for CORS)"),
});

const parsedEnv = requiredEnvSchema.safeParse(process.env);
if (!parsedEnv.success) {
  const missing = parsedEnv.error.issues.map((issue) => issue.path.join("."));
  console.error(
    `❌ Missing or invalid required environment variables: ${missing.join(", ")}\n` +
      "   The server cannot start safely without these. See .env.example.",
  );
  process.exit(1);
}

if (process.env.NODE_ENV === "production") {
  const issues: string[] = [];
  const requireHttpsUrl = (name: string, value?: string) => {
    try {
      if (!value || new URL(value).protocol !== "https:") issues.push(name);
    } catch {
      issues.push(name);
    }
  };
  const requireCompleteGroup = (name: string, values: Array<string | undefined>) => {
    const configured = values.filter((value) => value?.trim()).length;
    if (configured > 0 && configured < values.length) issues.push(name);
  };

  if (!process.env.DATABASE_URL?.startsWith("postgresql://")) {
    issues.push("DATABASE_URL (must be PostgreSQL)");
  }
  for (const name of [
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "JWT_PASS_RESET_SECRET",
    "ADMIN_BOOTSTRAP_SECRET",
  ] as const) {
    const value = process.env[name] ?? "";
    if (value.length < 32 || /change-me|replace-me/i.test(value)) issues.push(name);
  }
  if (
    new Set([
      process.env.JWT_ACCESS_SECRET,
      process.env.JWT_REFRESH_SECRET,
      process.env.JWT_PASS_RESET_SECRET,
    ]).size !== 3
  ) {
    issues.push("JWT secrets (must be distinct)");
  }

  process.env.FRONTEND_URL?.split(",").forEach((url) =>
    requireHttpsUrl("FRONTEND_URL", url.trim()),
  );
  requireHttpsUrl("RESET_PASSWORD_URL", process.env.RESET_PASSWORD_URL);
  requireHttpsUrl("VERIFY_EMAIL_URL", process.env.VERIFY_EMAIL_URL);
  if (!/^\.[A-Za-z0-9.-]+$/.test(process.env.AUTH_COOKIE_DOMAIN ?? "")) {
    issues.push("AUTH_COOKIE_DOMAIN");
  }
  const saltRounds = Number(process.env.BCRYPT_SALT_NUMBER ?? "12");
  if (!Number.isInteger(saltRounds) || saltRounds < 10) {
    issues.push("BCRYPT_SALT_NUMBER");
  }

  requireCompleteGroup("CLOUDINARY_*", [
    process.env.CLOUDINARY_CLOUD_NAME,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_API_SECRET,
  ]);
  requireCompleteGroup("SMTP_*", [
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_USER,
    process.env.SMTP_PASS,
    process.env.SMTP_FROM,
  ]);
  requireCompleteGroup("GOOGLE_*", [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL,
  ]);
  requireCompleteGroup("MIM_SMS_*", [
    process.env.MIM_SMS_USERNAME,
    process.env.MIM_SMS_API_KEY,
    process.env.MIM_SMS_SENDER_NAME,
  ]);

  if (issues.length) {
    console.error(
      `Invalid production environment: ${[...new Set(issues)].join(", ")}.`,
    );
    process.exit(1);
  }
}

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  frontend_url:
    process.env.FRONTEND_URL?.split(",").map((url) => url.trim())[0] ||
    "http://localhost:3000",
  frontend_urls: process.env.FRONTEND_URL?.split(",").map((url) =>
    url.trim(),
  ) || ["http://localhost:3000"],
  reset_pass_url: process.env.RESET_PASSWORD_URL,
  verify_email_url: process.env.VERIFY_EMAIL_URL,
  auth_cookie_domain: process.env.AUTH_COOKIE_DOMAIN,
  bcrypt_salt_number: process.env.BCRYPT_SALT_NUMBER,
  admin_bootstrap_secret: process.env.ADMIN_BOOTSTRAP_SECRET,
  jwt: {
    jwt_access_secret: process.env.JWT_ACCESS_SECRET,
    jwt_access_expires: process.env.JWT_ACCESS_EXPIRES,
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
    jwt_refresh_expires: process.env.JWT_REFRESH_EXPIRES,
    jwt_pass_reset_secret: process.env.JWT_PASS_RESET_SECRET,
    jwt_pass_reset_expires: process.env.JWT_PASS_RESET_EXPIRES,
  },
  cloudinary: {
    api_secret: process.env.CLOUDINARY_API_SECRET,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
  },
  email: {
    smtp_host: process.env.SMTP_HOST,
    smtp_port: process.env.SMTP_PORT,
    smtp_user: process.env.SMTP_USER,
    smtp_pass: process.env.SMTP_PASS,
    smtp_from: process.env.SMTP_FROM,
  },
  redis: {
    redis_host: process.env.REDIS_HOST,
    redis_port: process.env.REDIS_PORT,
    redis_username: process.env.REDIS_USERNAME,
    redis_password: process.env.REDIS_PASSWORD,
    redis_url: process.env.REDIS_URL,
  },
  google: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    callback_url: process.env.GOOGLE_CALLBACK_URL,
  },
  mimsms: {
    username: process.env.MIM_SMS_USERNAME,
    api_key: process.env.MIM_SMS_API_KEY,
    sender_name: process.env.MIM_SMS_SENDER_NAME,
    transaction_type: process.env.MIM_SMS_TRANSACTION_TYPE || "T",
  },
};
