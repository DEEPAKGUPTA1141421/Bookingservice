import { z } from "zod";

export const createServiceProviderSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Invalid email format" }).optional(),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits long" }),
  image: z.string().url({ message: "Invalid image URL" }).optional(),
  status: z.enum(["verified", "unverified"]).default("unverified"),
  company_name: z.string().optional(),
  license_no: z.string().min(5, { message: "License number must be at least 5 characters long" }).optional(),
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

export const updateServiceProviderSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters long" })
      .optional(),
    email: z.string().email({ message: "Invalid email format" }).optional(),
    phone: z
      .string()
      .min(10, { message: "Phone number must be at least 10 digits long" })
      .optional(),
    image: z.string().url({ message: "Invalid image URL" }).optional(),
    status: z.enum(["verified", "unverified"]).optional(),
    company_name: z.string().optional(),
    license_no: z
      .string()
      .min(5, { message: "License number must be at least 5 characters long" })
      .optional(),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().default("IN").optional(),
        location: z
          .object({
            type: z.literal("Point").default("Point").optional(),
            coordinates: z
              .array(z.union([z.string(), z.number()]))
              .length(2, {
                message: "Coordinates must be [longitude, latitude]",
              })
              .transform(([long, lat]) => {
                const parsedLong = Number(long);
                const parsedLat = Number(lat);
                if (isNaN(parsedLong) || isNaN(parsedLat)) {
                  throw new Error("Coordinates must be valid numbers");
                }
                return [parsedLong, parsedLat];
              })
              .optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided for update",
  });
