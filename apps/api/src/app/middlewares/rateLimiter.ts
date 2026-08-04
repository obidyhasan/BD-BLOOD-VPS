import rateLimit from "express-rate-limit";

/**
 * Scoped rate limiters for endpoints where the app-wide limiter (300
 * req/15min per IP, in app.ts) is far too loose to matter on its own —
 * credential brute-forcing, OTP/email spam, and administrative operations
 * each need their own, much tighter ceiling.
 *
 * All respond in the same { success, message } shape the rest of the API
 * uses, so a 429 looks like any other handled error to API consumers.
 */

const jsonRateLimitMessage = (message: string) => ({
  success: false,
  message,
});

/** Login, password reset request/submit — guards against credential brute-forcing. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonRateLimitMessage(
    "Too many attempts. Please try again in a few minutes.",
  ),
});

/** OTP / verification-email sends — these have a real per-message SMS/email cost. */
export const outboundMessageRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonRateLimitMessage(
    "Too many requests. Please wait a few minutes before trying again.",
  ),
});

/** Rare, highly sensitive administrative operations (e.g. bootstrapping the first admin). */
export const sensitiveActionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonRateLimitMessage(
    "Too many attempts. Please try again later.",
  ),
});

/**
 * Public, unauthenticated blood-request submission — each submission fans
 * out real SMS to organizations and donors, so this endpoint doubles as an
 * SMS-cost/spam vector if left unthrottled.
 */
export const publicBloodRequestRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonRateLimitMessage(
    "Too many blood requests submitted from this network recently. Please try again later, or contact us directly for urgent needs.",
  ),
});
