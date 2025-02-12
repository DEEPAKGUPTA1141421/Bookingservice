import { IBaseSchema } from "../utils/GlobalTypescript";
import { Schema, model, Types } from "mongoose";

// ✅ Define Interface for ServiceOption
interface IServiceOption extends IBaseSchema {
  actualService: Types.ObjectId; // FK to ActualService
  name: string; // Option Name
  price: number; // Price for this option
  discount_price?: number; // Optional Discount Price
  duration: number; // Duration in minutes
  description?: string; // Optional Description
  service_provider: Types.ObjectId; // FK to ServiceProvider
  images?: string[]; // Array of image URLs
  rating?: number; // Default rating
}

// ✅ Define Interface for ActualService
interface IActualService extends IBaseSchema {
  name: string; // Service Name
  description?: string; // Optional Description
  images?: string[]; // Service Images
  service: Types.ObjectId; // FK to Service
}

// ✅ Define Mongoose Schema for ServiceOption
const ServiceOptionSchema = new Schema<IServiceOption>(
  {
    actualService: { type: Schema.Types.ObjectId, ref: "ActualService", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    discount_price: { type: Number },
    duration: { type: Number, required: true },
    description: { type: String },
    service_provider: { type: Schema.Types.ObjectId, ref: "ServiceProvider", required: true },
    images: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true, strict: false }
);

// ✅ Indexing for Optimization
ServiceOptionSchema.index({ actualService: 1 });

// ✅ Define Mongoose Schema for ActualService
const ActualServiceSchema = new Schema<IActualService>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    images: { type: [String], default: [] },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
  },
  { timestamps: true, strict: false }
);

// ✅ Indexing for Optimization
ActualServiceSchema.index({ service: 1 });

// ✅ Create and Export Models
const ServiceOption = model<IServiceOption>("ServiceOption", ServiceOptionSchema);
const ActualService = model<IActualService>("ActualService", ActualServiceSchema);

export { ActualService, ServiceOption };
