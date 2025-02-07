import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

// Service Provider Availability Schema
const ServiceProviderAvailabilitySchema = new Schema(
  {
    provider: { type: Types.ObjectId, ref: "ServiceProvider", required: true }, // FK to Service Provider
    service: { type: Types.ObjectId, ref: "Service", required: true }, // FK to Service
    date: { type: Date, required: true }, // Available date
    start_time: { type: String, required: true }, // Start time of work
    end_time: { type: String, required: true }, // End time of work
    is_active: { type: Boolean, default: true }, // Active availability
  },
  { timestamps: true }
);

// Index for fast querying
ServiceProviderAvailabilitySchema.index({ provider: 1, date: 1 });
const ServiceProviderAvailability = model("ServiceProviderAvailability", ServiceProviderAvailabilitySchema);

export { ServiceProviderAvailability};