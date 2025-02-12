import { IBaseSchema } from "../utils/GlobalTypescript";
import { Schema, Types, model } from "mongoose";

// Define Email Types as a Union Type
type EmailType =
  | "sign_up"
  | "booking_success"
  | "payment_success"
  | "booking_cancel"
  | "refund_processed";

// Define Status Types as a Union Type
type EmailStatus = "pending" | "sent" | "failed";

// ✅ TypeScript Interface for Email Document (Extending IBaseSchema)
interface IEmail extends IBaseSchema {
  user: Types.ObjectId; // Reference to User
  email: string; // Email Address
  type: EmailType; // Email Type
  subject: string; // Email Subject
  content: string; // Email Body
  status: EmailStatus; // Email Status
  metadata?: Record<string, any>; // Dynamic Metadata (Booking ID, Payment ID, etc.)
  sentAt?: Date; // Timestamp when the email was sent
}

// ✅ Mongoose Schema with TypeScript Interface
const EmailSchema = new Schema<IEmail>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // ✅ Fixed Type
    email: { type: String, required: true },

    type: {
      type: String,
      enum: ["sign_up", "booking_success", "payment_success", "booking_cancel", "refund_processed"],
      required: true,
    },

    subject: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },

    metadata: { type: Schema.Types.Mixed, default: {} }, // Store dynamic data

    sentAt: { type: Date },
  },
  { timestamps: true, strict: false }
);

// ✅ Indexing for Optimization
EmailSchema.index({ user: 1 });
EmailSchema.index({ type: 1 });

// ✅ Create and Export the Model
const Email = model<IEmail>("Email", EmailSchema);
export { Email};
