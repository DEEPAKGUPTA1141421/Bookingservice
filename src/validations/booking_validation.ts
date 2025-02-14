import * as z from "zod";

export const createBookingSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters long"),
});

export const updateBookingSchema = z.object({
  status: z.enum(["initiated", "confirmed", "delivered", "canceled"]).optional(),
  scheduledTime: z.string().optional(),
  completedTime: z.string().optional(),
});
