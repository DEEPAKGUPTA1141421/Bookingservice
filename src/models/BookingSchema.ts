import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

// Booking Schema
const BookingSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true }, // FK to User
    cart:{ type: Types.ObjectId, ref: "Cart", required: true },
    // Booking Status
    status: {
      type: String,
      enum: ["intiated","pending", "confirmed", "in-progress", "completed", "canceled"],
      default: "pending",
    },

    // Booking Time Details
    bookingDate: { type: Date, required: true }, // When the user wants the service
    scheduledTime: { type: Date }, // Exact scheduled time
    completedTime: { type: Date }, // When the service was completed

    // Address Information
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
      },
    }
  },
  { timestamps: true, strict: false }
);

// Geospatial Index for Location-Based Queries
BookingSchema.index({ "address.location": "2dsphere" });

// Indexing for faster queries
BookingSchema.index({ user: 1 });
BookingSchema.index({ serviceProvider: 1 });
BookingSchema.index({ actualService: 1 });
BookingSchema.index({ status: 1 });

// Creating Model
const Booking = model("Booking", BookingSchema);

export { Booking };
