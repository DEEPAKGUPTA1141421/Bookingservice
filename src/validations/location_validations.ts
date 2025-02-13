import { string, z } from "zod";

// Validation schema for latitude and longitude
export const getCoordinateSchema = z.object({
  latitude: z
    .number({ invalid_type_error: "Latitude must be a number" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number({ invalid_type_error: "Longitude must be a number" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
});

export const getAddressSchema = z.object({
  address: z.string().min(2, { message: "Address must be at least 2 characters long" }),
});

export const getDistanceTimeSchema = z.object({
  origin: z.string().min(2, { message: "Address must be at least 2 characters long" }),
  destination: z.string().min(2, { message: "Address must be at least 2 characters long" }),
});

export const getSuggestionSchema = z.object({   
  keyword: z.string().min(2, { message: "Keyword must be at least 2 characters long" }),
});