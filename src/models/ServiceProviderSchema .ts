import { IBaseSchema } from "../utils/GlobalTypescript";
import mongoose, { Document, Types, Schema } from "mongoose";

// ✅ Define the Interface for ServiceProvider Schema
export interface IServiceProvider extends IBaseSchema {
  name: string;
  email?: string;
  phone: string;
  actualService: Types.ObjectId; // Reference to ActualService
  ServiceId:Array<Types.ObjectId>,
  image?: string;
  status: "verified" | "unverified";
  company_name?: string;
  license_no?: string;
  rating: number;
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    location: {
      type: string; // Should always be 'Point' in this case
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
}

// Define Mongoose Schema for ServiceProvider
export const ServiceProviderSchema = new mongoose.Schema<IServiceProvider>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true },
    phone: { type: String, required: true, unique: true },
    actualService: {
      type: Schema.Types.ObjectId,
      ref: "ActualService",
      required: true,
    },
    ServiceId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Service",
        required: true,
      },
    ],
    image: { type: String },
    status: {
      type: String,
      enum: ["verified", "unverified"],
      default: "unverified",
    },
    company_name: { type: String },
    license_no: { type: String },
    rating: { type: Number, default: 0.0, min: 0, max: 5 },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
      },
    },
  },
  { timestamps: true, strict: false }
);

// Indexing for faster querying
ServiceProviderSchema.index({ "address.location": "2dsphere" });
// Define the Model
const ServiceProvider = mongoose.model<IServiceProvider>(
  "ServiceProvider",
  ServiceProviderSchema
);

export default ServiceProvider;
