import httpStatus from "http-status";
import config from "../../config";
import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { AuthService } from "./auth.service";
import sendResponse from "../../shared/sendResponse";
import { IJWTPayload } from "../../types";
import ApiError from "../../errors/ApiError";
import {
  clearAuthCookies,
  setAuthCookies,
} from "../../helper/authCookieHelper";

const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.login(req.body);
    const { accessToken, refreshToken, user } = result;
    clearAuthCookies(res);
    setAuthCookies(res, { accessToken, refreshToken });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User logged in successfully!",
      data: { accessToken, refreshToken, user },
    });
  },
);

const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.cookies;
    const result = await AuthService.refreshToken(refreshToken);
    clearAuthCookies(res);
    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Access token generated successfully!",
      data: {
        accessToken: result.accessToken,
        refreshToken,
      },
    });
  },
);

const changePassword = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await AuthService.changePassword(
      user as IJWTPayload,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password changed successfully!",
      data: result,
    });
  },
);

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: {
      expiresIn: result.expiresIn,
      resendAvailableIn: result.resendAvailableIn,
    },
  });
});

const verifyPasswordResetOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.verifyPasswordResetOtp(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Code verified. You can now create a new password.",
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully!",
    data: null,
  });
});

const bootstrapAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.bootstrapAdmin(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Admin bootstrap successful!",
    data: result,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.verifyEmail(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const resendVerificationEmail = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AuthService.resendVerificationEmail(req.body.email);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: {
        expiresIn: result.expiresIn,
        resendAvailableIn: result.resendAvailableIn,
      },
    });
  },
);

const googleAuth = catchAsync(async (req: Request, res: Response) => {
  const url = AuthService.getGoogleAuthUrl();
  res.redirect(url);
});

const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const frontendBase = config.frontend_url || "http://localhost:3000";
  const failureRedirect = (message: string) => {
    const url = new URL(`${frontendBase}/auth/google/callback`);
    url.searchParams.set("error", message);
    res.redirect(url.toString());
  };

  const code = req.query.code as string | undefined;
  if (!code) {
    return failureRedirect("Authorization code is missing.");
  }

  try {
    const result = await AuthService.handleGoogleCallback(code);
    clearAuthCookies(res);
    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    const redirectUrl = new URL(`${frontendBase}/auth/google/callback`);
    res.redirect(redirectUrl.toString());
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Google sign-in failed. Please try again.";
    failureRedirect(message);
  }
});

const sendPhoneOtp = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await AuthService.sendPhoneOtp(
      req.user as IJWTPayload,
      req.body.phone,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: result,
    });
  },
);

const verifyPhoneOtp = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await AuthService.verifyPhoneOtp(
      req.user as IJWTPayload,
      req.body.phone,
      req.body.otp,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: result,
    });
  },
);

const logout = catchAsync(async (_req: Request, res: Response) => {
  clearAuthCookies(res);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully!",
    data: null,
  });
});

export const AuthController = {
  login,
  refreshToken,
  changePassword,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  bootstrapAdmin,
  verifyEmail,
  resendVerificationEmail,
  sendPhoneOtp,
  verifyPhoneOtp,
  googleAuth,
  googleCallback,
  logout,
};
