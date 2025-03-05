import * as z from "zod";
import { objectIdSchema } from "../utils/helper";



export const createBookingSchema = z.object({
  date: z
    .string()
    .min(1, "Date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  start_time: z
    .string()
    .min(1, "Start time is required")
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM)"),
  providersList: z
    .array(z.string())
    .min(1, "At least one provider must be selected"),
  serviceoption:z.string()
});


export const updateBookingSchema = z.object({
  status: z
    .enum(["initiated", "confirmed", "delivered", "canceled"])
    .optional(),
  scheduledTime: z.string().optional(),
  completedTime: z.string().optional(),
  address: z.string().min(5, "Address must be at least 5 characters long"),
});

export const acceptBookingSchema = z.object({
  bookingId: objectIdSchema,
  providerId:objectIdSchema
});
