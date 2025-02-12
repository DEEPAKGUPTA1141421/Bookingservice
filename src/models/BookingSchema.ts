import { IBaseSchema } from "../utils/GlobalTypescript";
import { Schema, model, Types } from "mongoose";

// ✅ Define Interface for Booking
interface IBooking extends IBaseSchema {
  user: Types.ObjectId; // FK to User
  cart: Types.ObjectId; // FK to Cart
  status: "initiated" | "pending" | "confirmed" | "in-progress" | "completed" | "canceled"; // Booking status
  bookingDate: Date; // When the user wants the service
  scheduledTime?: Date; // Exact scheduled time (optional)
  completedTime?: Date; // When the service was completed (optional)

  // Address Information
  address: {
    street?: string; // Optional street address
    city?: string; // Optional city
    state?: string; // Optional state
    country?: string; // Optional country
    location: {
      type: "Point"; // Fixed to Point type for geospatial
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
}

// ✅ Define Mongoose Schema for Booking
const BookingSchema = new Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // FK to User
    cart: { type: Schema.Types.ObjectId, ref: "Cart", required: true }, // FK to Cart
    status: {
      type: String,
      enum: ["initiated", "pending", "confirmed", "in-progress", "completed", "canceled"],
      default: "pending",
    },
    bookingDate: { type: Date, required: true },
    scheduledTime: { type: Date },
    completedTime: { type: Date },
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
  { timestamps: true }
);

// Geospatial Index for Location-Based Queries
BookingSchema.index({ "address.location": "2dsphere" });

// Indexing for faster queries
BookingSchema.index({ user: 1 });
BookingSchema.index({ status: 1 });

// ✅ Create Model
const Booking = model<IBooking>("Booking", BookingSchema);

export { Booking };
