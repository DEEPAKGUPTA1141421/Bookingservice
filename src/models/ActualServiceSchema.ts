import { IBaseSchema } from "../utils/GlobalTypescript";
import { Schema, model, Types } from "mongoose";

// ✅ Define Interface for ServiceOption
interface IServiceOption extends IBaseSchema {
  actualService: Types.ObjectId; // FK to ActualService
  name: string; // Option Name
  price: string; // Price for this option
  discount_price?: string; // Optional Discount Price
  duration: number; // Duration in minutes
  upto: string;
  description?: string; // Optional Description
  service_provider: Types.ObjectId; // FK to ServiceProvider
  images?: string[]; // Array of image URLs
  rating?: number; // Default rating
  discount_type: "flat" | "percent";
}

interface IActualService extends IBaseSchema {
  name: string; // Service Name
  description?: string; // Optional Description
  images?: string[]; // Service Images
  service: Types.ObjectId; // FK to Service
  expert_is_trained_in?: string[]; // New field: Expert training categories
  service_excludes?: string[]; // New field: Exclusions of the service
  what_we_need_from_you?: { image: string; description: string }[]; // New field: Required items
}

// ✅ Define Mongoose Schema for ServiceOption
const ServiceOptionSchema = new Schema<IServiceOption>(
  {
    actualService: {
      type: Schema.Types.ObjectId,
      ref: "ActualService",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: String, required: true },
    discount_price: { type: String },
    upto: { type: String },
    discount_type: {
      type: String,
      enum: ["flat", "percent"],
      default: "percent",
    },
    description: { type: String },
    service_provider: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
    },
    images: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true, strict: false }
);

// ✅ Indexing for Optimization
ServiceOptionSchema.index({ actualService: 1 });

const ActualServiceSchema = new Schema<IActualService>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    images: { type: [String], default: [] },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    expert_is_trained_in: { type: [String], default: [] }, // Array of training categories
    service_excludes: { type: [String], default: [] }, // Array of exclusions
    what_we_need_from_you: {
      type: [{ image: String, description: String }],
      default: [],
    }, // Array of required items
  },
  { timestamps: true, strict: false }
);

// ✅ Indexing for Optimization
ActualServiceSchema.index({ service: 1 });

// ✅ Create and Export Models
const ServiceOption = model<IServiceOption>(
  "ServiceOption",
  ServiceOptionSchema
);
const ActualService = model<IActualService>(
  "ActualService",
  ActualServiceSchema
);

export { ActualService, ServiceOption };
