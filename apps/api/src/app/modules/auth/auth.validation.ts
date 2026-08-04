import { z } from "zod";

export const loginZodSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format"),
  password: z.string({ message: "Password is required" }),
});

export type loginZodSchemaType = z.infer<typeof loginZodSchema>;

export const changePasswordZodSchema = z.object({
  oldPassword: z.string({ message: "Old password is required" }),
  newPassword: z
    .string({ message: "New password is required" })
    .min(6, "New password must be at least 6 characters"),
});

export type changePasswordZodSchemaType = z.infer<
  typeof changePasswordZodSchema
>;

export const forgotPasswordZodSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format"),
});

export type forgotPasswordZodSchemaType = z.infer<
  typeof forgotPasswordZodSchema
>;


export const bootstrapAdminZodSchema = z.object({
  secret: z.string({ message: "Bootstrap secret is required" }).min(1),
  fullName: z.string({ message: "Full name is required" }).min(1),
  email: z.string({ message: "Email is required" }).email(),
  password: z.string({ message: "Password is required" }).min(6),
  bloodGroupId: z.string({ message: "Blood group ID is required" }).min(1),
  phone: z.string().optional(),
});

export type bootstrapAdminZodSchemaType = z.infer<
  typeof bootstrapAdminZodSchema
>;

export const verifyEmailZodSchema = z.object({
  email: z.string({ message: "Email is required" }).email(),
  otp: z
    .string({ message: "Verification code is required" })
    .regex(/^\d{6}$/, "Enter the 6-digit verification code"),
});

export type verifyEmailZodSchemaType = z.infer<typeof verifyEmailZodSchema>;

export const resendVerificationZodSchema = forgotPasswordZodSchema;

export type resendVerificationZodSchemaType = z.infer<
  typeof resendVerificationZodSchema
>;

export const verifyPasswordResetOtpZodSchema = verifyEmailZodSchema;
export type verifyPasswordResetOtpZodSchemaType = z.infer<
  typeof verifyPasswordResetOtpZodSchema
>;

export const resetPasswordZodSchema = z.object({
  email: z.string({ message: "Email is required" }).email(),
  resetToken: z
    .string({ message: "Password reset authorization is required" })
    .min(1),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});

export type resetPasswordZodSchemaType = z.infer<typeof resetPasswordZodSchema>;

export const sendPhoneOtpZodSchema = z.object({
  phone: z.string({ message: "Phone is required" }).min(10).max(15),
});

export const verifyPhoneOtpZodSchema = z.object({
  phone: z.string({ message: "Phone is required" }).min(10).max(15),
  otp: z
    .string({ message: "OTP is required" })
    .regex(/^\d{6}$/, "Enter the 6-digit OTP"),
});
