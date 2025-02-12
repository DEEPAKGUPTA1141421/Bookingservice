import { IBaseSchema } from "../utils/GlobalTypescript";
import mongoose, { Document, Types } from "mongoose";

// ✅ Define Interface for Otp
export interface IOtp extends IBaseSchema {
  user_id: Types.ObjectId; // Reference to User
  otp_code: string; // OTP code as a string
  expires_at: Date; // Expiry date of the OTP
  is_used: boolean; // Whether the OTP is used
  message?: string; // Optional message for the OTP
  typeOfOtp: "login" | "sign_up" | "delivered" | "reached"; // Type of OTP
}

// Define Mongoose Schema for Otp
const OtpSchema = new mongoose.Schema<IOtp>(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    otp_code: { type: String, required: true },
    expires_at: { type: Date, required: true },
    is_used: { type: Boolean, default: false },
    message: { type: String },
    typeOfOtp: {
      type: String,
      enum: ["login", "sign_up", "delivered", "reached"],
      required: true,
      default: "login",
    },
  },
  { timestamps: true, strict: false } // Automatically adds createdAt & updatedAt
);

// Index for fast retrieval
OtpSchema.index({ user_id: 1 });

// Define Model
const Otp = mongoose.model<IOtp>("Otp", OtpSchema);
export default Otp;
