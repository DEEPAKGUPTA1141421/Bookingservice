import { z } from "zod";

export const createPromoCodeSchema = z.object({
  service: z.string().uuid({ message: "Invalid service ID" }),
  code: z.string().min(5, { message: "Promo code must be at least 5 characters" }),
  description: z.string().optional(),
  minimum_booking_amount: z.number().optional(),
  max_discount_amount: z.number().optional(),
  actual_services: z.array(z.string()).nonempty({ message: "Actual services cannot be empty" }),
  total_available_per_user: z.number().optional(),
  total_available: z.number().optional(),
  rate: z.number().optional(),
  rate_type: z.enum(["flat", "percentage"]),
  applicable_on: z.enum(["base", "price"]),
  active: z.boolean().default(true),
  auto_apply: z.boolean().default(false),
  partner_services: z.object({}).optional(), // Define more detailed structure if needed
  tnc: z.string().optional(),
  expiry_date: z.string().optional(),
  display: z.boolean().optional(),
  payment_type: z.number().default(0),
  min_card_txn_value: z.number().optional(),
  period: z.enum(["weekly", "monthly", "yearly"]),
  limit_per_period: z.number(),
});

export const updatePromoCodeSchema = createPromoCodeSchema.partial();
