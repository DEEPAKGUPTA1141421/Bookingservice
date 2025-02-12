import { IBaseSchema } from "../utils/GlobalTypescript";
import mongoose, { Document, Types, Schema } from "mongoose";

// ✅ Define Interface for ServiceProviderAvailability
export interface IServiceProviderAvailability extends IBaseSchema {
  provider: Types.ObjectId; // Reference to ServiceProvider
  service: Types.ObjectId; // Reference to Service
  date: Date; // Date of availability
  start_time: string; // Start time of work
  end_time: string; // End time of work
  is_active: boolean; // Active status of availability
}

// Define Mongoose Schema for ServiceProviderAvailability
const ServiceProviderAvailabilitySchema = new mongoose.Schema<IServiceProviderAvailability>(
  {
    provider: { type: Schema.Types.ObjectId, ref: "ServiceProvider", required: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    date: { type: Date, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexing for fast querying
ServiceProviderAvailabilitySchema.index({ provider: 1, date: 1 });

// Define Model
const ServiceProviderAvailability = mongoose.model<IServiceProviderAvailability>("ServiceProviderAvailability", ServiceProviderAvailabilitySchema);

export { ServiceProviderAvailability };
