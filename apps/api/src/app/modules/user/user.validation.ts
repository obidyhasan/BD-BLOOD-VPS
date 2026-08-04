import z from "zod";
import { AvailabilityStatus, AccountStatus, Role } from "@prisma/client";

export const createUserZodSchema = z.object({
  fullName: z
    .string({ message: "Full name is required" })
    .min(1, "Full name cannot be empty"),
  phone: z.string().optional(),
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format"),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
  bloodGroupId: z.string({ message: "Blood Group ID is required" }),
  referrerId: z.string().optional(),
  referenceEmail: z
    .string()
    .email("Reference email must be a valid email address")
    .optional()
    .or(z.literal("")),
});

export const updateUserZodSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  bloodGroupId: z.string().optional(),
  divisionId: z.string().optional(),
  districtId: z.string().optional(),
  upazilaId: z.string().optional(),
  availabilityStatus: z.nativeEnum(AvailabilityStatus).optional(),
  profilePhoto: z.string().url().optional(),
  bio: z.string().optional(),
  accountStatus: z.nativeEnum(AccountStatus).optional(),
  referrerId: z.string().optional(),
  notifyInApp: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
});

export const adminUpdateUserZodSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  bloodGroupId: z.string().optional(),
  divisionId: z.string().optional().nullable(),
  districtId: z.string().optional().nullable(),
  upazilaId: z.string().optional().nullable(),
  lastDonationDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) =>
      v === undefined ? undefined : v instanceof Date ? v : new Date(v),
    ),
  availabilityStatus: z.nativeEnum(AvailabilityStatus).optional(),
  profilePhoto: z.string().url().optional().nullable(),
  bio: z.string().optional().nullable(),
  referenceId: z.string().optional().nullable(),
  accountStatus: z.nativeEnum(AccountStatus).optional(),
  role: z.nativeEnum(Role).optional(),
  isVerified: z.boolean().optional(),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
  adminUpdateUserZodSchema,
};
