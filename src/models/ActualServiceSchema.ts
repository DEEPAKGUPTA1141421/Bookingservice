import { IBaseSchema } from "../utils/GlobalTypescript";
import { Schema, model, Types } from "mongoose";

// ✅ Define Interface for ServiceOption
export interface IServiceOption extends IBaseSchema {
  actualService: Types.ObjectId; // FK to ActualService
  name: string; // Option Name
  price: number; // Price for this option
  discount_price?: number; // Optional Discount Price
  duration: number; // Duration in minutes
  upto: number;
  description?: string; // Optional Description
  images?: string[]; // Array of image URLs
  rating?: number; // Default rating
  discount_type: "flat" | "percent";
  providerIds?: string[];
}

interface IActualService extends IBaseSchema {
  name: string; // Service Name
  description?: string; // Optional Description
  images?: string[]; // Service Images
  service: Types.ObjectId; // FK to Service
  options?: Array<Types.ObjectId>;
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
    price: { type: Number, required: true },
    discount_price: { type: Number },
    upto: { type: Number },
    discount_type: {
      type: String,
      enum: ["flat", "percent"],
      required:true
    },
    description: { type: String },
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
    options: [{ type: Schema.Types.ObjectId, ref: "ServiceOption" }],
    expert_is_trained_in: { type: [String], default: [] }, // Array of training categories
    service_excludes: { type: [String], default: [] }, // Array of exclusions
    what_we_need_from_you: { type: [String], default: [] }, // Array of required items
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
