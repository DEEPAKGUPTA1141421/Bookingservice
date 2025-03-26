import * as z from "zod";
import { objectIdSchema } from "../utils/helper";

export const createBookingSchema = z.object({
  date: z.string().min(1, "Date is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute").optional(),
  start_time: z.string().min(1, "Start time is required"),
  providersList: z
    .array(z.string())
    .min(1, "At least one provider must be selected"),
  serviceoption: z.string(),
  actualService: z.string(),
});

export const updateBookingSchema = z.object({
  status: z.enum(["confirmed", "delivered", "cancelled"]),
  address: z.object({
    current_address: z
      .string()
      .min(5, "Address must be at least 5 characters long"),
    location: z.object({
      type: z.literal("Point"), // Ensure type is always "Point"
      coordinates: z.tuple([z.number(), z.number()]), // Validate two-number coordinates (lat, lng)
    }),
  }),
  bookingId: z.string(),
  pointsUsed: z.number(),
  modeOfPayment: z.enum(["cash", "net-banking"]),
  finalPrice: z.number(),
});

export const acceptBookingSchema = z.object({
  bookingId: objectIdSchema,
  providerId: objectIdSchema,
});
