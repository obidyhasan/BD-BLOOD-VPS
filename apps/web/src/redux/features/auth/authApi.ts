import { baseApi } from "../../api/baseApi";
import {
  AuthResponse,
  LoginRequest,
  RefreshTokenResponse,
  RegisterRequest,
  User,
} from "./auth.types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
      // Do NOT invalidate here — tags are invalidated manually after setCredentials()
      // to avoid unauthenticated refetch requests racing against token storage.
    }),

    register: builder.mutation<
      { success: boolean; message: string; data: User },
      RegisterRequest
    >({
      query: (data) => ({
        url: "/user/create",
        method: "POST",
        body: data,
      }),
    }),

    getMe: builder.query<{ success: boolean; data: User }, void>({
      query: () => ({ url: "/user/me", method: "GET" }),
      providesTags: ["Auth"],
    }),

    refreshToken: builder.mutation<RefreshTokenResponse, void>({
      query: () => ({ url: "/auth/refresh-token", method: "POST" }),
    }),

    changePassword: builder.mutation<
      { success: boolean; message: string },
      { oldPassword: string; newPassword: string }
    >({
      query: (data) => ({
        url: "/auth/change-password",
        method: "POST",
        body: data,
      }),
    }),

    forgotPassword: builder.mutation<
      {
        success: boolean;
        message: string;
        data: { expiresIn: number; resendAvailableIn: number };
      },
      { email: string }
    >({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    verifyPasswordResetOtp: builder.mutation<
      {
        success: boolean;
        message: string;
        data: { resetToken: string; expiresIn: number };
      },
      { email: string; otp: string }
    >({
      query: (body) => ({
        url: "/auth/verify-password-reset-otp",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation<
      { success: boolean; message: string },
      { email: string; resetToken: string; password: string }
    >({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),

    verifyEmail: builder.mutation<
      { success: boolean; message: string },
      { email: string; otp: string }
    >({
      query: (body) => ({
        url: "/auth/verify-email",
        method: "POST",
        body,
      }),
    }),

    resendVerification: builder.mutation<
      {
        success: boolean;
        message: string;
        data: { expiresIn: number; resendAvailableIn: number };
      },
      { email: string }
    >({
      query: (body) => ({
        url: "/auth/resend-verification",
        method: "POST",
        body,
      }),
    }),

    sendPhoneOtp: builder.mutation<
      { success: boolean; message: string },
      { phone: string }
    >({
      query: (body) => ({
        url: "/auth/send-phone-otp",
        method: "POST",
        body,
      }),
    }),

    verifyPhoneOtp: builder.mutation<
      { success: boolean; message: string },
      { phone: string; otp: string }
    >({
      query: (body) => ({
        url: "/auth/verify-phone-otp",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User", "Auth"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useRefreshTokenMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useVerifyPasswordResetOtpMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useSendPhoneOtpMutation,
  useVerifyPhoneOtpMutation,
} = authApi;
