import { Bool } from "aws-sdk/clients/clouddirectory";
import { IBaseSchema } from "../utils/GlobalTypescript";
import { Schema, model, Types } from "mongoose";

export interface IBooking extends IBaseSchema {
  user: Types.ObjectId;
  cart: Types.ObjectId;
  bookingSlot_id: Types.ObjectId;
  status:
    | "initiated"
    | "pending"
    | "confirmed"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "delivered"; // Booking status
  bookingDate: Date;
  scheduledTime?: Date;
  completedTime?: Date;
  reached: boolean; // Use lowercase boolean, not Boolean

  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    location: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
}

const BookingSchema = new Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cart: { type: Schema.Types.ObjectId, ref: "Cart", required: true },
    bookingSlot_id: {
      type: Schema.Types.ObjectId,
      ref: "BookedSlot",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values({
        initiated: "initiated",
        pending: "pending",
        confirmed: "confirmed",
        inProgress: "in-progress",
        completed: "completed",
        cancelled: "cancelled",
        delivered: "delivered",
      }),
      default: "initiated",
    },
    bookingDate: { type: Date, required: true },
    scheduledTime: { type: Boolean },
    completedTime: { type: Date },
    reached: { type: Boolean, default: false },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true },
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
