import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

// Cart Item Schema (Each service added to cart)
export const CartItemSchema = new Schema(
  {
    service: { type: Types.ObjectId, ref: "ActualService", required: true }, // FK to Service
    service_option: {
      type: Types.ObjectId,
      ref: "ServiceOption",
      required: true,
    }, // FK to Service Option
    quantity: { type: Number, required: true, min: 1 }, // Quantity of service
    price: { type: Number, required: true }, // Price per unit
  },
  { _id: false }
);

// Promo Code Schema (Stores applied promo codes)
const PromoCodeSchema = new Schema(
  {
    service: { type: Types.ObjectId, ref: "ActualService", required: true },
    code: { type: String, required: true, unique: true },
    applicable_on: { type: String, enum: ["base", "price"] },
    discount_type: {
      type: String,
      enum: ["flat", "percentage"],
      required: true,
    }, // Flat or percentage
    discount_value: { type: Number, required: true }, // Discount value (e.g., 10% or $10)
    min_order_value: { type: Number, default: 0 }, // Minimum order value for promo
    max_discount: { type: Number, default: null }, // Maximum discount cap
    expiry_date: { type: Date, required: true }, // Expiration date
    is_active: { type: Boolean, default: true }, // Active status
    display: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Cart Schema
const CartSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true }, // FK to User
    items: [CartItemSchema], // List of services in cart
    promo_code: { type: String, ref: "PromoCode", default: null }, // Applied promo code
    total_price: { type: Number, required: true, default: 0 }, // Cart total before discount
    discount: { type: Number, default: 0 }, // Discount amount
    final_price: { type: Number, required: true, default: 0 }, // Total after discount
  },
  { timestamps: true }
);

// Index for faster cart lookups
CartSchema.index({ user: 1 });

const Cart = model("Cart", CartSchema);
const CartItem = model("CartItem", CartItemSchema);
const PromoCode = model("PromoCode", PromoCodeSchema);

export { CartItem, Cart, PromoCode };
