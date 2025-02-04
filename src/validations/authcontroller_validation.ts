import { z } from "zod";

// Validation schema for sending OTP
export const sendOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

// Validation schema for verifying OTP
export const verifyOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});
