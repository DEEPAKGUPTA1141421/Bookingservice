import { z } from "zod";

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .length(10, "Phone number must be exactly 10 digits")
    .regex(/^[0-9]{10}$/, {
      message: "Phone number must contain only digits (0-9)",
    }),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .length(10, "Phone number must be exactly 10 digits")
    .regex(/^[0-9]{10}$/, {
      message: "Phone number must contain only digits (0-9)",
    }),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^[0-9]{6}$/, { message: "OTP must contain only digits (0-9)" }),
});

export const editUserSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters long" })
      .max(50, { message: "Name must be at most 50 characters long" })
      .regex(/^[A-Za-z ]+$/, {
        message: "Name must contain only alphabets and spaces",
      })
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
      .regex(/^[0-9]{10}$/, {
        message: "Phone number must contain only digits (0-9)",
      })
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long" })
      .optional(),

    latitude: z
      .union([z.string(), z.number(), z.null()])
      .transform((val) => (val !== null ? Number(val) : null))
      .refine(
        (val) => val === null || (!isNaN(val) && val >= -90 && val <= 90),
        {
          message: "Latitude must be a number between -90 and 90 or null",
        }
      ).optional(),

    longitude: z
      .union([z.string(), z.number(), z.null()])
      .transform((val) => (val !== null ? Number(val) : null))
      .refine(
        (val) => val === null || (!isNaN(val) && val >= -180 && val <= 180),
        {
          message: "Longitude must be a number between -180 and 180 or null",
        }
      ).optional(),

    role: z.enum(["user", "admin", "provider"]).optional(),
    add_address: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
    path: [],
  });
