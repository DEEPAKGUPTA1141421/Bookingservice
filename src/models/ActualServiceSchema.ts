import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

// Service Option Schema (Linked to Actual Service)
const ServiceOptionSchema = new Schema(
  {
    actualService: { type: Types.ObjectId, ref: "ActualService", required: true }, // Foreign key
    name: { type: String, required: true }, // e.g., "2 Sofa Cleaning"
    price: { type: Number, required: true }, // Price for this option
    discount_price:{type:Number},
    duration: { type: Number, required: true }, // Estimated duration in minutes
    description: { type: String }, // Optional description
    service_provider: { type: Types.ObjectId, ref: "ServiceProvider", required: true },
    images: { type: [String], default: [] },
    rating:{type: Number,default: 0}
  },
  { timestamps: true, strict: false }
);

// Indexing for fast lookups
ServiceOptionSchema.index({ actualService: 1 });

// Actual Service Schema
const ActualServiceSchema = new Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., "Sofa Cleaning"
    description: { type: String },
    images: { type: [String], default: [] },
    service: { type: Types.ObjectId, ref: "Service", required: true }, // Foreign key to Service
    options: [{ type: Types.ObjectId, ref: "ServiceOption" }], // Linking options
  },
  { timestamps: true, strict: false }
);

// Indexing for fast lookups
ActualServiceSchema.index({ service: 1 });

// Creating Models
const ServiceOption = model("ServiceOption", ServiceOptionSchema);
const ActualService = model("ActualService", ActualServiceSchema);

export { ActualService, ServiceOption };
