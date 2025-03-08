import { z } from "zod";
import { objectIdSchema } from "../utils/helper";

export const createPromoCodeSchema = z.object({
  Actualservices:z.array(objectIdSchema),
  code: z
    .string()
    .min(5, { message: "Promo code must be at least 5 characters" }),
  description: z.string().optional(),
  minimum_booking_amount: z.number().optional(),
  max_discount_amount: z.number().optional(),
  total_available_per_user: z.number().optional(),
  total_available: z.number().optional(),
  rate: z.number().optional(),
  rate_type: z.enum(["flat", "percentage"]),
  applicable_on: z.enum(["base", "price"]),
  active: z.boolean().default(true),
  auto_apply: z.boolean().default(false),
  tnc: z.string().optional(),
  expiry_date: z.string().optional(),
  display: z.boolean().optional(),
  period: z.enum(["weekly", "monthly", "yearly"]).optional(),
  limit_per_period: z.number().optional(),
});

export const updatePromoCodeSchema = createPromoCodeSchema.partial();
