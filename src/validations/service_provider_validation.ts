import { z } from "zod";

export const createServiceProviderSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Invalid email format" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits long" }),
  image: z.string().url({ message: "Invalid image URL" }).optional(),
  role: z.enum(["provider"]).default("provider"),
  status: z.enum(["verified", "unverified"]).default("unverified"),
  company_name: z.string().optional(),
  license_no: z.string().min(5, { message: "License number must be at least 5 characters long" }),
  rating: z.preprocess((val) => Number(val), z.number().min(0).max(5).default(0)),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    location: z.object({
      type: z.literal("Point").default("Point"),
      coordinates: z.array(z.number()).length(2, { message: "Coordinates must be [longitude, latitude]" }),
    }),
  }),
});
