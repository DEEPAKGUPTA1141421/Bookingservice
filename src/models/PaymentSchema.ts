import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const PaymentSchema = new Schema(
  {
    booking: { type: Types.ObjectId, ref: "Booking", required: true }, // FK to Booking
    user: { type: Types.ObjectId, ref: "User", required: true }, // FK to User
    serviceProvider: { type: Types.ObjectId, ref: "ServiceProvider", required: true }, // FK to Provider

    amount: { type: Number, required: true }, // Payment Amount
    currency: { type: String, default: "INR" }, // Currency Type (USD, INR, etc.)
    method: { type: String, enum: ["cash", "credit_card", "upi", "wallet"], required: true }, // Payment Method
    transactionId: { type: String, unique: true }, // Unique Transaction ID
    status: { type: String, enum: ["intiated","pending", "paid", "failed"], default: "intiated" }, // Payment Status

    pg_response: { type: Schema.Types.Mixed, default: {} }, // Stores the entire Payment Gateway response

    createdAt: { type: Date, default: Date.now }, // Payment Creation Date
  },
  { timestamps: true, strict: false }
);

// Indexing for Faster Queries
PaymentSchema.index({ booking: 1 });
PaymentSchema.index({ user: 1 });
PaymentSchema.index({ serviceProvider: 1 });

const Payment = model("Payment", PaymentSchema);
export { Payment };
