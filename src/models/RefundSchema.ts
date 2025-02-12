import { IBaseSchema } from "../utils/GlobalTypescript";
import mongoose, { Document, SchemaTypeOptions, Types,Schema } from "mongoose";

// ✅ Define Interface for Refund
export interface IRefund extends IBaseSchema {
  payment: Types.ObjectId; // Reference to Payment
  user: Types.ObjectId; // Reference to User
  amount: number; // Refunded Amount
  reason: string; // Reason for the refund
  status: "initiated" | "pending" | "processed" | "failed"; // Refund status
  refundedAt?: Date; // Refund processed date (optional)
  pg_response: Record<string, unknown>; // Payment Gateway response for the refund
}

// Define Mongoose Schema for Refund
const RefundSchema = new mongoose.Schema<IRefund>(
  {
    payment: { type: Schema.Types.ObjectId, ref: "Payment", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["initiated", "pending", "processed", "failed"], default: "initiated" },
    refundedAt: { type: Date },
    pg_response: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, strict: false }
);

// Indexing for Faster Queries
RefundSchema.index({ payment: 1 });
RefundSchema.index({ user: 1 });

// Define Model
const Refund = mongoose.model<IRefund>("Refund", RefundSchema);

export { Refund };
