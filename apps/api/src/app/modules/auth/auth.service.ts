import httpStatus from "http-status";
import { randomBytes } from "crypto";
import { prisma } from "../../shared/prisma";
import bcrypt from "bcryptjs";
import config from "../../config";
import ApiError from "../../errors/ApiError";
import { Secret } from "jsonwebtoken";
import emailSender from "../../helper/emailSender";
import { otpHelper } from "../../helper/otpHelper";
import { smsHelper } from "../../helper/smsHelper";
import { jwtHelper } from "../../helper/jwtHelper";
import { IJWTPayload } from "../../types";
import { AccountStatus, Role } from "@prisma/client";
import { cacheHelper } from "../../helper/cacheHelper";
import {
  changePasswordZodSchemaType,
  forgotPasswordZodSchemaType,
  loginZodSchemaType,
  bootstrapAdminZodSchemaType,
  resetPasswordZodSchemaType,
  verifyEmailZodSchemaType,
  verifyPasswordResetOtpZodSchemaType,
} from "./auth.validation";

const login = async (payload: loginZodSchemaType) => {
  const user = await prisma.donor.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found with this email!");
  }

  if (user.accountStatus === AccountStatus.INACTIVE) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your account is inactive. Please contact support.",
    );
  }

  if (user.accountStatus === AccountStatus.SUSPENDED) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your account has been suspended!",
    );
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    user.password,
  );

  if (!isCorrectPassword) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid password. Please try again.",
    );
  }

  if (!user.isVerified && user.role !== Role.ADMIN) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Please verify your email before logging in.",
      "",
      "EMAIL_NOT_VERIFIED",
    );
  }

  const accessToken = jwtHelper.generateToken(
    { email: user.email, role: user.role },
    config.jwt.jwt_access_secret as string,
    config.jwt.jwt_access_expires as string,
  );

  const refreshToken = jwtHelper.generateToken(
    { email: user.email, role: user.role },
    config.jwt.jwt_refresh_secret as string,
    config.jwt.jwt_refresh_expires as string,
  );

  const { password: _password, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token is missing!");
  }

  let decodedData;
  try {
    decodedData = jwtHelper.verifyToken(
      token,
      config.jwt.jwt_refresh_secret as string,
    );
  } catch (error) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired refresh token!",
    );
  }

  const user = await prisma.donor.findUnique({
    where: {
      email: decodedData.email,
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Active user account not found!");
  }

  const accessToken = jwtHelper.generateToken(
    {
      email: user.email,
      role: user.role,
    },
    config.jwt.jwt_access_secret as Secret,
    config.jwt.jwt_access_expires as string,
  );

  return {
    accessToken,
  };
};

const changePassword = async (
  user: IJWTPayload,
  payload: changePasswordZodSchemaType,
) => {
  const userData = await prisma.donor.findUnique({
    where: {
      email: user.email,
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, "Active user account not found!");
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.oldPassword,
    userData.password,
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Old password does not match!");
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_number),
  );

  await prisma.donor.update({
    where: {
      email: userData.email,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: "Password changed successfully!",
  };
};

const OTP_EXPIRY_MINUTES = 5;
const GENERIC_RESET_MESSAGE =
  "If an active account exists for that email, a 6-digit reset code has been sent.";

const throwOtpError = (
  result: Awaited<ReturnType<typeof otpHelper.verifyOtp>>,
) => {
  if (result.status === "expired") {
    throw new ApiError(
      httpStatus.GONE,
      "This code has expired. Request a new code to continue.",
      "",
      "OTP_EXPIRED",
    );
  }
  if (result.status === "locked") {
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      "Too many incorrect attempts. Request a new code to try again.",
      "",
      "OTP_ATTEMPTS_EXCEEDED",
    );
  }
  if (result.status === "invalid") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `That code is incorrect. ${result.attemptsRemaining} attempt${result.attemptsRemaining === 1 ? "" : "s"} remaining.`,
      "",
      "OTP_INVALID",
    );
  }
};

const issueEmailOtp = async (
  email: string,
  purpose: "email_verification" | "password_reset",
  userName: string,
) => {
  try {
    const issued = await otpHelper.issueOtp(email, purpose);
    await emailSender(
      email,
      purpose === "email_verification"
        ? "Your BD Blood verification code"
        : "Your BD Blood password reset code",
      purpose === "email_verification" ? "verify-email" : "reset-password",
      {
        userName,
        otp: issued.otp,
        expiresInMinutes: OTP_EXPIRY_MINUTES,
      },
    );
    return {
      expiresIn: issued.expiresIn,
      resendAvailableIn: issued.resendAvailableIn,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "OTP_COOLDOWN") {
      const retryAfter =
        (error as Error & { retryAfter?: number }).retryAfter ?? 60;
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        `Please wait ${retryAfter} seconds before requesting another code.`,
        "",
        "OTP_COOLDOWN",
      );
    }
    throw error;
  }
};

const forgotPassword = async (payload: forgotPasswordZodSchemaType) => {
  const email = payload.email.trim().toLowerCase();
  const userData = await prisma.donor.findUnique({
    where: { email, accountStatus: AccountStatus.ACTIVE, isDeleted: false },
  });

  if (!userData) {
    return { message: GENERIC_RESET_MESSAGE, expiresIn: 300, resendAvailableIn: 60 };
  }

  const metadata = await issueEmailOtp(
    userData.email,
    "password_reset",
    userData.fullName,
  );
  return { message: GENERIC_RESET_MESSAGE, ...metadata };
};

const verifyPasswordResetOtp = async (
  payload: verifyPasswordResetOtpZodSchemaType,
) => {
  const email = payload.email.trim().toLowerCase();
  const userData = await prisma.donor.findUnique({
    where: { email, accountStatus: AccountStatus.ACTIVE, isDeleted: false },
  });
  if (!userData) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The code is invalid or has expired.",
      "",
      "OTP_INVALID",
    );
  }

  const verification = await otpHelper.verifyOtp(
    email,
    "password_reset",
    payload.otp,
  );
  throwOtpError(verification);
  const resetToken = await otpHelper.createResetGrant(email);
  return { resetToken, expiresIn: 600 };
};

const resetPassword = async (payload: resetPasswordZodSchemaType) => {
  const email = payload.email.trim().toLowerCase();
  const authorized = await otpHelper.consumeResetGrant(email, payload.resetToken);
  if (!authorized) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your password reset session is invalid or has expired. Verify a new code to continue.",
      "",
      "RESET_AUTHORIZATION_INVALID",
    );
  }

  const userData = await prisma.donor.findUnique({
    where: { email, accountStatus: AccountStatus.ACTIVE, isDeleted: false },
  });
  if (!userData) {
    throw new ApiError(httpStatus.FORBIDDEN, "Password reset could not be completed.");
  }

  const password = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_number),
  );
  await prisma.donor.update({ where: { email }, data: { password } });
  return { message: "Password reset successfully!" };
};

const bootstrapAdmin = async (payload: bootstrapAdminZodSchemaType) => {
  if (!config.admin_bootstrap_secret) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "ADMIN_BOOTSTRAP_SECRET is not configured on the server.",
    );
  }

  if (payload.secret !== config.admin_bootstrap_secret) {
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid bootstrap secret!");
  }

  const existingAdmin = await prisma.donor.findFirst({
    where: {
      role: Role.ADMIN,
      isDeleted: false,
    },
  });

  if (existingAdmin) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Admin already exists. Bootstrap is disabled.",
    );
  }

  const bloodGroup = await prisma.bloodGroup.findUnique({
    where: { id: payload.bloodGroupId, isDeleted: false },
  });
  if (!bloodGroup) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invalid Blood Group ID!");
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_number),
  );

  const admin = await prisma.donor.create({
    data: {
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      password: hashedPassword,
      bloodGroup: {
        connect: {
          id: payload.bloodGroupId,
        },
      },
      role: Role.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      isVerified: true,
      verifiedAt: new Date(),
    } as any,
    omit: { password: true },
  });

  return admin;
};

const sendVerificationEmail = async (rawEmail: string) => {
  const email = rawEmail.trim().toLowerCase();
  const userData = await prisma.donor.findUnique({
    where: { email, isDeleted: false, accountStatus: AccountStatus.ACTIVE },
  });

  if (!userData || userData.isVerified) {
    return {
      message:
        "If this email belongs to an unverified account, a verification code has been sent.",
      expiresIn: 300,
      resendAvailableIn: 60,
    };
  }

  const metadata = await issueEmailOtp(
    userData.email,
    "email_verification",
    userData.fullName,
  );
  return {
    message: "A new 6-digit verification code has been sent to your email.",
    ...metadata,
  };
};

const verifyEmail = async (payload: verifyEmailZodSchemaType) => {
  const email = payload.email.trim().toLowerCase();
  const userData = await prisma.donor.findUnique({
    where: { email, isDeleted: false, accountStatus: AccountStatus.ACTIVE },
  });
  if (!userData) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The code is invalid or has expired.",
      "",
      "OTP_INVALID",
    );
  }
  if (userData.isVerified) return { message: "Email is already verified." };

  const verification = await otpHelper.verifyOtp(
    email,
    "email_verification",
    payload.otp,
  );
  throwOtpError(verification);

  await prisma.donor.update({
    where: { email },
    data: { isVerified: true, verifiedAt: new Date() },
  });
  await cacheHelper.invalidateCache(`auth:userCheck:${email}`);
  return { message: "Email verified successfully!" };
};

const resendVerificationEmail = async (email: string) => {
  return sendVerificationEmail(email);
};

const issueAuthTokens = async (email: string, role: Role) => {
  const accessToken = jwtHelper.generateToken(
    { email, role },
    config.jwt.jwt_access_secret as Secret,
    config.jwt.jwt_access_expires as string,
  );

  const refreshToken = jwtHelper.generateToken(
    { email, role },
    config.jwt.jwt_refresh_secret as Secret,
    config.jwt.jwt_refresh_expires as string,
  );

  const userRecord = await prisma.donor.findUnique({
    where: { email, isDeleted: false },
  });

  if (!userRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  const { password: _password, ...user } = userRecord;

  return { accessToken, refreshToken, user };
};

const getGoogleAuthUrl = () => {
  if (!config.google.client_id || !config.google.callback_url) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Google OAuth is not configured on the server.",
    );
  }

  const params = new URLSearchParams({
    client_id: config.google.client_id,
    redirect_uri: config.google.callback_url,
    response_type: "code",
    scope: "email profile",
    access_type: "online",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const handleGoogleCallback = async (code: string) => {
  if (
    !config.google.client_id ||
    !config.google.client_secret ||
    !config.google.callback_url
  ) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Google OAuth is not configured on the server.",
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.google.client_id,
      client_secret: config.google.client_secret,
      redirect_uri: config.google.callback_url,
      grant_type: "authorization_code",
    }),
  });

  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      tokenJson.error || "Failed to exchange Google authorization code.",
    );
  }

  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    },
  );

  const profile = (await profileRes.json()) as {
    email?: string;
    name?: string;
    verified_email?: boolean;
  };

  if (!profileRes.ok || !profile.email) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Failed to load Google profile.",
    );
  }

  if (profile.verified_email === false) {
    throw new ApiError(httpStatus.FORBIDDEN, "Google email is not verified.");
  }

  let user = await prisma.donor.findUnique({
    where: { email: profile.email },
  });

  if (user?.isDeleted) {
    const defaultGroup = await prisma.bloodGroup.findFirst({
      where: { isDeleted: false },
    });
    if (!defaultGroup) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "No blood groups configured.",
      );
    }

    const hashedPassword = await bcrypt.hash(
      randomBytes(32).toString("hex"),
      Number(config.bcrypt_salt_number),
    );

    user = await prisma.donor.update({
      where: { email: profile.email },
      data: {
        fullName: profile.name || profile.email.split("@")[0],
        password: hashedPassword,
        isDeleted: false,
        accountStatus: AccountStatus.ACTIVE,
        isVerified: true,
        verifiedAt: new Date(),
        bloodGroupId: defaultGroup.id,
        role: Role.DONOR,
      },
    });
  } else if (!user) {
    const defaultGroup = await prisma.bloodGroup.findFirst({
      where: { isDeleted: false },
    });
    if (!defaultGroup) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "No blood groups configured.",
      );
    }

    const hashedPassword = await bcrypt.hash(
      randomBytes(32).toString("hex"),
      Number(config.bcrypt_salt_number),
    );

    user = await prisma.donor.create({
      data: {
        fullName: profile.name || profile.email.split("@")[0],
        email: profile.email,
        password: hashedPassword,
        bloodGroupId: defaultGroup.id,
        role: Role.DONOR,
        accountStatus: AccountStatus.ACTIVE,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
  }

  if (user.accountStatus === AccountStatus.INACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is inactive.");
  }
  if (user.accountStatus === AccountStatus.SUSPENDED) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your account has been suspended.",
    );
  }

  if (!user.isVerified) {
    await prisma.donor.update({
      where: { email: user.email },
      data: { isVerified: true, verifiedAt: new Date() },
    });
  }

  return issueAuthTokens(user.email, user.role);
};

const sendPhoneOtp = async (user: IJWTPayload, phone: string) => {
  const donor = await prisma.donor.findUnique({
    where: { email: user.email, isDeleted: false },
  });
  if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

  const taken = await prisma.donor.findFirst({
    where: { phone, isDeleted: false, NOT: { id: donor.id } },
  });
  if (taken) {
    throw new ApiError(httpStatus.CONFLICT, "Phone number is already in use.");
  }

  const issued = await otpHelper.issueOtp(phone, "phone");

  const smsResult = await smsHelper.sendOtpSms(phone, issued.otp);
  if (!smsResult.success && config.node_env === "production") {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Failed to send OTP SMS. Please try again later.",
    );
  }

  return { message: "OTP sent to your phone number." };
};

const verifyPhoneOtp = async (
  user: IJWTPayload,
  phone: string,
  otp: string,
) => {
  const verification = await otpHelper.verifyOtp(phone, "phone", otp);
  throwOtpError(verification);

  const donor = await prisma.donor.findUnique({
    where: { email: user.email, isDeleted: false },
  });
  if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

  const taken = await prisma.donor.findFirst({
    where: { phone, isDeleted: false, NOT: { id: donor.id } },
  });
  if (taken) {
    throw new ApiError(httpStatus.CONFLICT, "Phone number is already in use.");
  }

  await prisma.donor.update({
    where: { id: donor.id },
    data: { phone, phoneVerifiedAt: new Date() },
  });

  return { message: "Phone number verified successfully." };
};

export const AuthService = {
  login,
  refreshToken,
  changePassword,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  bootstrapAdmin,
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail,
  sendPhoneOtp,
  verifyPhoneOtp,
  getGoogleAuthUrl,
  handleGoogleCallback,
  issueAuthTokens,
};
