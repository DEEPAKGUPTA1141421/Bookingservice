import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const EmailSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true }, // FK to User
    email: { type: String, required: true }, // User's Email Address

    type: {
      type: String,
      enum: [
        "sign_up", // Welcome Email after Sign-up
        "booking_success", // Booking Confirmation
        "payment_success", // Payment Success Confirmation
        "booking_cancel", // Booking Cancellation Notice
        "refund_processed", // Refund Processed
      ],
      required: true,
    },

    subject: { type: String, required: true }, // Email Subject
    content: { type: String, required: true }, // Email Body Content
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" }, // Status Tracking

    metadata: { type: Schema.Types.Mixed, default: {} }, // Store Dynamic Data (Booking ID, Payment ID, etc.)

    sentAt: { type: Date }, // Timestamp when the email was sent
  },
  { timestamps: true, strict: false }
);

// Indexing for faster queries
EmailSchema.index({ user: 1 });
EmailSchema.index({ type: 1 });

const Email = model("Email", EmailSchema);
export { Email };
