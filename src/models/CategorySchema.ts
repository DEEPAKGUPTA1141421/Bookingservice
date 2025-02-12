import { IBaseSchema } from "../utils/GlobalTypescript";
import { Schema, model, Types } from "mongoose";

// ✅ Define Interface for Category
export interface ICategory extends IBaseSchema {
  name: string;
  description?: string; // Optional description
  images: string[]; // Array of image URLs
}

// ✅ Define Interface for Service
export interface IService extends IBaseSchema {
  name: string;
  description?: string; // Optional description
  images: string[]; // Array of image URLs
  category: Types.ObjectId; // FK to Category
}

// ✅ Define Mongoose Schema for Category
const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, unique: true, required: true },
    description: { type: String },
    images: { type: [String], default: [] },
  },
  { timestamps: true, strict: false }
);

// Index for faster queries
CategorySchema.index({ name: 1 });

// ✅ Define Mongoose Schema for Service
const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    images: { type: [String], default: [] },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true }, // Foreign key to Category
  },
  { timestamps: true, strict: false }
);

// Indexing for fast lookups
ServiceSchema.index({ category: 1 });

// ✅ Create Models
const Category = model<ICategory>("Category", CategorySchema);
const Service = model<IService>("Service", ServiceSchema);

export { Category, Service };
