import { z } from "zod";

// MongoDB ObjectId validation regex (24-character hex string)
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

// Validation for adding to cart
export const addToCartSchema = z.object({
  serviceOptionId: objectIdSchema,
  quantity: z.number().int().positive("Quantity must be greater than 0"),
});

// Validation for applying promo codes
export const applyPromoCodeSchema = z.object({
  promoCode: z.string().min(1, "Promo Code is required"),
});
