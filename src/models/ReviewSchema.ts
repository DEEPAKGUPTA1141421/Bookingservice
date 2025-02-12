import { IBaseSchema } from "../utils/GlobalTypescript";
import mongoose, { Document, SchemaTypeOptions, Types,Schema } from "mongoose";

// ✅ Define Interface for Review
export interface IReview extends IBaseSchema {
  actualService: Types.ObjectId; // Reference to ActualService
  serviceOption: Types.ObjectId; // Reference to ServiceOption
  serviceProvider: Types.ObjectId; // Reference to ServiceProvider
  user: Types.ObjectId; // Reference to User
  rating: number; // Rating between 1-5
  comment?: string; // Optional user comment
}

// Define Mongoose Schema for Review
const ReviewSchema = new mongoose.Schema<IReview>(
  {
    actualService: { type: Schema.Types.ObjectId, ref: "ActualService", required: true },
    serviceOption: { type: Schema.Types.ObjectId, ref: "ServiceOption", required: true },
    serviceProvider: { type: Schema.Types.ObjectId, ref: "ServiceProvider", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true, strict: false }
);

// Indexing for efficient queries
ReviewSchema.index({ actualService: 1 });
ReviewSchema.index({ serviceOption: 1 });
ReviewSchema.index({ serviceProvider: 1 });
ReviewSchema.index({ user: 1 });

// Define Model
const Review = mongoose.model<IReview>("Review", ReviewSchema);

export { Review };
