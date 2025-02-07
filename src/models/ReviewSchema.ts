import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

// Review Schema (Linked to Actual Service, Service Option, and Provider)
const ReviewSchema = new Schema(
  {
    actualService: { type: Types.ObjectId, ref: "ActualService", required: true }, // FK to ActualService
    serviceOption: { type: Types.ObjectId, ref: "ServiceOption", required: true }, // FK to ServiceOption
    serviceProvider: { type: Types.ObjectId, ref: "ServiceProvider", required: true }, // FK to ServiceProvider
    user: { type: Types.ObjectId, ref: "User", required: true }, // FK to User who gave the review
    rating: { type: Number, required: true, min: 1, max: 5 }, // Rating between 1-5
    comment: { type: String, default: "" }, // Optional user comment
  },
  { timestamps: true, strict: false }
);

// Indexing for efficient queries
ReviewSchema.index({ actualService: 1 });
ReviewSchema.index({ serviceOption: 1 });
ReviewSchema.index({ serviceProvider: 1 });
ReviewSchema.index({ user: 1 });

// Creating Model
const Review = model("Review", ReviewSchema);

export { Review };
