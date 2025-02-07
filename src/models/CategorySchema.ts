import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

// Service Schema (References Category)
const ServiceSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    images: { type: [String], default: [] },
    category: { type: Types.ObjectId, ref: "Category", required: true }, // Foreign key
  },
  { timestamps: true, strict:false }
);

// Indexing for fast lookups
ServiceSchema.index({ category: 1 });

// Category Schema
const CategorySchema = new Schema(
  {
    name: { type: String, unique: true, required: true },
    description: { type: String },
    images: { type: [String], default: [] },
  },
  { timestamps: true,strict:false }
);




// Index for faster queries
CategorySchema.index({ name: 1 });

// Creating Models
const Category = model("Category", CategorySchema);
const Service = model("Service", ServiceSchema);

export { Category, Service };
