import { z } from "zod";

export const sendOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export const editUserSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters long" })
      .max(50, { message: "Name must be at most 50 characters long" })
      .optional()
      .or(z.literal("")), // Allow empty string but not undefined
    email: z
      .string()
      .email({ message: "Invalid email address" })
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .length(10, { message: "Phone number must be exactly 10 digits" })
      .regex(/^\d{10}$/, { message: "Invalid phone number format" })
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long" })
      .optional(),
    role: z.enum(["user", "admin", "provider"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
    path: [],
  });
