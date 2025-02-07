import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;
const RefundSchema = new Schema(
    {
      payment: { type: Types.ObjectId, ref: "Payment", required: true }, // FK to Payment
      user: { type: Types.ObjectId, ref: "User", required: true }, // FK to User
      amount: { type: Number, required: true }, // Amount Refunded
      reason: { type: String, required: true }, // Reason for Refund
      status: { type: String, enum: ["intiated","pending", "processed", "failed"], default: "intiated" }, // Refund Status
      refundedAt: { type: Date }, // Refund Processed Date
  
      pg_response: { type: Schema.Types.Mixed, default: {} }, // Stores the Payment Gateway refund response
  
    },
    { timestamps: true, strict: false }
  );
  
  // Indexing for Faster Queries
  RefundSchema.index({ payment: 1 });
  RefundSchema.index({ user: 1 });
  
  const Refund = model("Refund", RefundSchema);
  export { Refund };
  