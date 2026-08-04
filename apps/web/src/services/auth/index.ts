"use server";

import { serverFetch } from "@/helper/server-fetch";
import { BACKEND_API_URL } from "@/lib/backend";
import { deleteCookie, setCookie } from "@/services/auth/tokenHandlers";

export const loginUser = async (data: {
  email: string;
  password: string;
  rememberMe?: boolean;
}) => {
  try {
    const res = await serverFetch.post("/auth/login", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success && result.data) {
      await setCookie("accessToken", result.data.accessToken, {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 60,
        path: "/",
        sameSite: "lax",
      });
      await setCookie("refreshToken", result.data.refreshToken, {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
      });
    }
    return result;
  } catch {
    return { success: false, message: "Login failed" };
  }
};

export const registerUser = async (data: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  bloodGroupId?: string;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
}) => {
  try {
    const res = await serverFetch.post("/user/create", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch {
    return { success: false, message: "Registration failed" };
  }
};

export const verifyEmail = async (data: { email: string; otp: string }) => {
  try {
    const res = await serverFetch.post("/auth/verify-email", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch {
    return { success: false, message: "Email verification failed" };
  }
};

export const resendVerification = async (data: { email: string }) => {
  try {
    const res = await serverFetch.post("/auth/resend-verification", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch {
    return { success: false, message: "Resend verification failed" };
  }
};

export const forgotPassword = async (data: { email: string }) => {
  try {
    const res = await serverFetch.post("/auth/forgot-password", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch {
    return { success: false, message: "Forgot password request failed" };
  }
};

export const verifyPasswordResetOtp = async (data: {
  email: string;
  otp: string;
}) => {
  try {
    const res = await serverFetch.post("/auth/verify-password-reset-otp", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch {
    return { success: false, message: "Password reset code verification failed" };
  }
};

export const resetPassword = async (data: {
  email: string;
  resetToken: string;
  password: string;
}) => {
  try {
    const res = await serverFetch.post("/auth/reset-password", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch {
    return { success: false, message: "Reset password failed" };
  }
};

export const changePassword = async (data: {
  oldPassword: string;
  newPassword: string;
}) => {
  try {
    const res = await serverFetch.post("/auth/change-password", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch {
    return { success: false, message: "Change password failed" };
  }
};

export const logoutUser = async () => {
  try {
    await fetch(`${BACKEND_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    }).catch(() => undefined);
    await Promise.all([
      deleteCookie("accessToken"),
      deleteCookie("refreshToken"),
    ]);
    return { success: true, message: "Logged out successfully" };
  } catch {
    return { success: false, message: "Logout failed" };
  }
};

export const sendPhoneOtp = async (data: { phone: string }) => {
  try {
    const res = await serverFetch.post("/auth/send-phone-otp", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch {
    return { success: false, message: "Send phone OTP failed" };
  }
};

export const verifyPhoneOtp = async (data: { phone: string; otp: string }) => {
  try {
    const res = await serverFetch.post("/auth/verify-phone-otp", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch {
    return { success: false, message: "Verify phone OTP failed" };
  }
};
