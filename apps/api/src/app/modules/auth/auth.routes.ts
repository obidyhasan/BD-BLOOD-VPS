import { Router } from "express";
import { AuthController } from "./auth.controller";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import {
  authRateLimiter,
  outboundMessageRateLimiter,
  sensitiveActionRateLimiter,
} from "../../middlewares/rateLimiter";
import {
  bootstrapAdminZodSchema,
  changePasswordZodSchema,
  forgotPasswordZodSchema,
  loginZodSchema,
  resendVerificationZodSchema,
  resetPasswordZodSchema,
  sendPhoneOtpZodSchema,
  verifyEmailZodSchema,
  verifyPasswordResetOtpZodSchema,
  verifyPhoneOtpZodSchema,
} from "./auth.validation";

const router = Router();

router.post(
  "/login",
  authRateLimiter,
  validateRequest(loginZodSchema),
  AuthController.login,
);

router.get("/google", AuthController.googleAuth);

router.get("/google/callback", AuthController.googleCallback);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/logout", AuthController.logout);

router.post(
  "/change-password",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(changePasswordZodSchema),
  AuthController.changePassword,
);

router.post(
  "/forgot-password",
  authRateLimiter,
  validateRequest(forgotPasswordZodSchema),
  AuthController.forgotPassword,
);

router.post(
  "/verify-password-reset-otp",
  authRateLimiter,
  validateRequest(verifyPasswordResetOtpZodSchema),
  AuthController.verifyPasswordResetOtp,
);

router.post(
  "/reset-password",
  authRateLimiter,
  validateRequest(resetPasswordZodSchema),
  AuthController.resetPassword,
);

router.post(
  "/bootstrap-admin",
  sensitiveActionRateLimiter,
  validateRequest(bootstrapAdminZodSchema),
  AuthController.bootstrapAdmin,
);

router.post(
  "/verify-email",
  authRateLimiter,
  validateRequest(verifyEmailZodSchema),
  AuthController.verifyEmail,
);

router.post(
  "/resend-verification",
  outboundMessageRateLimiter,
  validateRequest(resendVerificationZodSchema),
  AuthController.resendVerificationEmail,
);

router.post(
  "/send-phone-otp",
  auth(Role.ADMIN, Role.DONOR),
  outboundMessageRateLimiter,
  validateRequest(sendPhoneOtpZodSchema),
  AuthController.sendPhoneOtp,
);

router.post(
  "/verify-phone-otp",
  auth(Role.ADMIN, Role.DONOR),
  authRateLimiter,
  validateRequest(verifyPhoneOtpZodSchema),
  AuthController.verifyPhoneOtp,
);

export const AuthRouter = router;
