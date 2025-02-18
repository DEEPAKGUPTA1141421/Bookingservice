import { IBaseSchema } from "../utils/GlobalTypescript";
import mongoose, { Document, SchemaTypeOptions, Types, Schema } from "mongoose";

// ✅ Define Interface for Payment
export interface IPayment extends IBaseSchema {
  booking: Types.ObjectId; // Reference to Booking
  user: Types.ObjectId; // Reference to User
  serviceProvider: Types.ObjectId; // Reference to ServiceProvider
  amount: number; // Payment Amount
  currency: string; // Currency type (INR, USD, etc.)
  method: "cash" | "credit_card" | "upi" | "wallet"; // Payment Method
  transactionId?: string; // Unique transaction ID
  status: "INITIATED" | "PENDING" | "SUCCESS" | "FAILED"; // Payment status
  pg_response: Record<string, unknown>; // Payment Gateway response (dynamic)
  createdAt: Date; // Payment creation date
}

// Define Mongoose Schema for Payment
const PaymentSchema = new mongoose.Schema<IPayment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    method: {
      type: String,
      enum: ["cash", "credit_card", "upi", "wallet"],
      required: true,
    },
    transactionId: { type: String, unique: true,required:true },
    status: {
      type: String,
      enum: ["INITIATED", "PENDING", "SUCCESS", "FAILED"],
      default: "INITIATED",
    },
    pg_response: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true, strict: false }
);

// Indexing for Faster Queries
PaymentSchema.index({ booking: 1 });
PaymentSchema.index({ user: 1 });
PaymentSchema.index({ serviceProvider: 1 });

// Define Model
const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);

export { Payment };
