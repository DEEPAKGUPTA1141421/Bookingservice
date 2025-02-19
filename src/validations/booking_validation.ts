import * as z from "zod";
import { objectIdSchema } from "../utils/helper";

export const createBookingSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters long"),
});

export const updateBookingSchema = z.object({
  status: z.enum(["initiated", "confirmed", "delivered", "canceled"]).optional(),
  scheduledTime: z.string().optional(),
  completedTime: z.string().optional(),
});

export const acceptBookingSchema = z.object({
  bookingId: objectIdSchema,
  providerId:objectIdSchema
});
