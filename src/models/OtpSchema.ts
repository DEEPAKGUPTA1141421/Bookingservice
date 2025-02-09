import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    otp_code: { type: String, required: true },
    expires_at: { type: Date, required: true},
    is_used: { type: Boolean, default: false },
    message:{type: String},
    typeOfOtp: {
      type: String,
      enum: ["login", "sign_up", "delivered", "reached"],
      required: true,
      default:"login"
    },
  },
  { timestamps: true, strict:false } // Automatically adds createdAt & updatedAt
);

// Index for fast retrieval
OtpSchema.index({ user_id: 1 });

const Otp = mongoose.model("Otp", OtpSchema);
export default Otp;