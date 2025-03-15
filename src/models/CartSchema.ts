import mongoose, { ObjectId } from "mongoose";
import { IBaseSchema } from "../utils/GlobalTypescript";
import { Schema, model, Types } from "mongoose";

export interface IPromoCode extends IBaseSchema {
  code: string;
  description: string;
  minimum_booking_amount: number | 0;
  max_discount_amount: number;
  Actualservices: Types.ObjectId[];
  total_available_per_user?: number;
  total_available?: number;
  rate: number;
  rate_type?: string;
  applicable_on?: string;
  active?: boolean;
  auto_apply?: boolean;
  partner_services?: object;
  tnc?: string;
  expiry_date?: Date;
  display?: boolean;
  payment_type?: number;
  min_card_txn_value?: number;
  period?: "weekly" | "monthly" | "yearly";
  limit_per_period?: number;
  typeofPromoCode: "refer";
  referId: Types.ObjectId;
}

export interface ICartItem {
  _id: Types.ObjectId;
  service: Types.ObjectId; // Reference to ActualService
  service_option: Types.ObjectId; // Reference to ServiceOption
  quantity: number; // Quantity of the service
  price: number; // Price per unit
}

export interface ICart {
  user: Types.ObjectId; // Reference to User
  items: ICartItem[]; // Array of CartItems
  promo_code: string | null; // Applied promo code, can be null
  total_price: number; // Cart total before discount
  discount: number; // Discount applied to the cart
  final_price: number; // Total after discount
  createdAt: Date; // Timestamp when the cart was created
  updatedAt: Date; // Timestamp when the cart was last updated
}

// Cart Item Schema (Each service added to cart)
interface CartItem {
  service: mongoose.Types.ObjectId;
  service_option: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export const CartItemSchema = new Schema<ICartItem>(
  {
    service: {
      type: Schema.Types.ObjectId,
      ref: "ActualService",
      required: true,
    }, // FK to Service
    service_option: {
      type: Schema.Types.ObjectId,
      ref: "ServiceOption",
      required: true,
    }, // FK to Service Option
    quantity: { type: Number, required: true, min: 1 }, // Quantity of service
    price: { type: Number, required: true }, // Price per unit
  },
  { _id: false }
);

const PromoCodeSchema = new Schema<IPromoCode>(
  {
    Actualservices: [
      {
        type: Types.ObjectId,
        ref: "ActualService",
        required: true,
      },
    ],
    typeofPromoCode: { type: String, default: "refer" },
    referId: { type: Schema.Types.ObjectId, ref: "User" },
    // ✅ Move validate inside the array definition
    code: { type: String, required: true, unique: true }, // Promo code string
    description: { type: String }, // Description of the promo code
    minimum_booking_amount: { type: Number }, // Minimum booking amount to apply the promo code
    max_discount_amount: { type: Number }, // Maximum discount that can be applied
    total_available_per_user: { type: Number }, // Total number of times the promo code can be used per user
    total_available: { type: Number }, // Total number of promo codes available
    rate: { type: Number, required: true }, // Discount rate (flat or percentage)
    rate_type: { type: String, enum: ["flat", "percentage"] }, // Rate type, either flat or percentage
    applicable_on: { type: String, enum: ["base", "price"] }, // What the promo applies to, base price or final price
    active: { type: Boolean, default: true }, // Whether the promo code is active or not
    auto_apply: { type: Boolean, default: false }, // Whether the promo applies automatically
    partner_services: { type: Schema.Types.Mixed }, // Partner services in JSON format
    tnc: { type: String }, // Terms and conditions for the promo
    expiry_date: { type: Date }, // Expiry date of the promo code
    display: { type: Boolean }, // Whether the promo is displayed or not
    payment_type: { type: Number, default: 0 }, // Payment type (e.g., credit card, etc.)
    min_card_txn_value: { type: Number }, // Minimum card transaction value to apply the promo

    // New fields
    period: { type: String, enum: ["weekly", "monthly", "yearly"] }, // Period for the promo code validity
    limit_per_period: { type: Number }, // Limit of how many times the promo can be applied per period
  },
  { timestamps: true }
);

// Cart Schema
const CartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // FK to User
    items: {
      type: [
        {
          type: CartItemSchema,
          unique: true, // ❌ This does NOT work on arrays
        },
      ],
      validate: {
        validator: function (items: CartItem[]) {
          const uniqueServiceOptions = new Set(
            items.map((item) => item.service_option.toString())
          );
          return uniqueServiceOptions.size === items.length;
        },
        message: "Duplicate service_option found in cart items.",
      },
    },
    promo_code: { type: String, ref: "PromoCode", default: null }, // Applied promo code
    total_price: { type: Number, required: true, default: 0 }, // Cart total before discount
    discount: { type: Number, default: 0 }, // Discount amount
    final_price: { type: Number, required: true, default: 0 }, // Total after discount
  },
  { timestamps: true }
);

// Index for faster cart lookups
CartSchema.index({ user: 1 });

const Cart = model<ICart>("Cart", CartSchema);
const CartItem = model<ICartItem>("CartItem", CartItemSchema);
const PromoCode = model<IPromoCode>("PromoCode", PromoCodeSchema);
PromoCodeSchema.path("Actualservices").validate(function (
  items: Types.ObjectId[]
) {
  const uniqueServiceOptions = new Set(items.map((item) => item.toString()));
  return uniqueServiceOptions.size === items.length;
},
"Duplicate service_option found in Actualservices.");

export { CartItem, Cart, PromoCode };
