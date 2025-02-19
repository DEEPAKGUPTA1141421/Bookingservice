import { number, z } from "zod";
import { objectIdSchema } from "../utils/helper";

export const getAvailableSlotsSchema = z.object({
  date: z.string().min(1, "Date is required"),
  actualserviceid: z.string().min(1, "Service ID is required"),
  latitude: z
    .number({ invalid_type_error: "Latitude must be a number" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number({ invalid_type_error: "Longitude must be a number" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  range: z.number({ invalid_type_error: "Range must be a number" }),
  minute: z.number().refine(val => [30, 60, 90, 120].includes(val), {
    message: "Minutes must be one of 30, 60, 90, or 120",
  })
});

export const BookSlotValidationSchema = z.object({
  userId: objectIdSchema,
  cartId: objectIdSchema,
  providerIds: z
    .array(z.string().min(1, "Provider ID is required"))
    .min(1, "At least one provider ID is required"),
  serviceId: z.string().min(1, "Service ID is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  slotTiming: z.number().refine((val) => [30, 60, 90, 120].includes(val), {
    message: "Minutes must be one of 30, 60, 90, or 120",
  }),
  endTime: z.string().min(1, "End time is required"),
  address: z.object({
    street: z.string().optional(),
    city: z.string(),
    state: z.string(),
    country: z.string().default("IN"),
    location: z.object({
      type: z.literal("Point").default("Point"),
      coordinates: z
        .array(z.union([z.string(), z.number()]))
        .length(2, { message: "Coordinates must be [longitude, latitude]" })
        .transform(([long, lat]) => {
          const parsedLong = Number(long);
          const parsedLat = Number(lat);
          if (isNaN(parsedLong) || isNaN(parsedLat)) {
            throw new Error("Coordinates must be valid numbers");
          }
          return [parsedLong, parsedLat];
        }),
    }),
  }),
});
