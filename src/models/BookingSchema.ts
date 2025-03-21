import { Bool } from "aws-sdk/clients/clouddirectory";
import { IBaseSchema } from "../utils/GlobalTypescript";
import mongoose, { Schema, model, Types } from "mongoose";
import { connectedProviders, wss } from "..";
export interface IBooking extends IBaseSchema {
  user: Types.ObjectId;
  bookingSlot_id: Types.ObjectId;
  actualPrice: number;
  discount: number;
  taxes: number;
  finalPrice: number;
  promoDiscount: number;
  promoCode: Types.ObjectId;
  paidByPoints: number;
  paidbyCard: number;
  status:
    | "initiated"
    | "pending"
    | "confirmed"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "verified"
    | "delivered"; // Booking status
  scheduledTime?: Date;
  completedTime?: Date;
  provider: Types.ObjectId;
  reached: boolean; // Use lowercase boolean, not Boolean
  pointsUsed: number;
  modeOfPayment: "cash" | "net-banking";

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
    bookingSlot_id: {
      type: Schema.Types.ObjectId,
      ref: "BookedSlot",
      required: true,
    },
    modeOfPayment: { type: String,enum:["cash","net-banking"]},
    pointsUsed:{type:Number,default:0},
    actualPrice: { type: Number, required: true }, // Stored as cents or a string
    discount: { type: Number, default: 0 }, // Discount stored safely as a string
    taxes: { type: Number, required: true }, // 18% tax stored as string
    promoCode: { type: Schema.Types.ObjectId, ref: "PromoCode", default: null }, // Promo code applied
    promoDiscount: { type: Number, default: 0 }, // Promo discount
    finalPrice: { type: Number, required: true }, // Final computed price (stored as string)
    paidByPoints: { type: Number},
    paidbyCard: { type: Number },
    status: {
      type: String,
      enum: Object.values({
        initiated: "initiated",
        pending: "pending",
        verified: "verified",
        confirmed: "confirmed",
        inProgress: "in-progress",
        completed: "completed",
        cancelled: "cancelled",
        delivered: "delivered",
      }),
      default: "initiated",
    },
    reached: { type: Boolean, default: false },

    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      location: {
        type: {
          type: String,
          enum: ["Point"],
          required: function () {
            return this.address?.location?.coordinates?.length === 2;
          }, // ✅ Only required if coordinates exist
        },
        coordinates: {
          type: [Number],
          required: false, // ✅ Allow missing initially
          validate: {
            validator: function (v: number[]) {
              return !v || (Array.isArray(v) && v.length === 2);
            },
            message: "Coordinates must be an array of [longitude, latitude]",
          },
        },
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
BookingSchema.post("save", async function (booking) {
  if (booking.status != "confirmed") {
    return;
  }
  console.log("📢 New booking created, notifying relevant providers...");
  // Populate booking details before sending
  const populatedBooking = await mongoose
    .model("Booking")
    .findById(booking._id)
    .populate("user", "name email") // Populate user info
    .populate("cart") // Populate cart info
    .populate("bookingSlot_id") // Populate slot details
    .lean();

  // Find providers from booked slot
  const bookedSlot = await mongoose
    .model("BookedSlot")
    .findById(booking.bookingSlot_id);

  if (!bookedSlot || !bookedSlot.providers) return;

  bookedSlot.providers.forEach((providerId: string) => {
    const ws = connectedProviders.get(providerId); // Get provider's WebSocket connection

    if (ws && ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: "NEW_BOOKING",
          providerId,
          message: "A new booking is available. Please accept.",
          booking: populatedBooking, // Send full booking details
        })
      );
      console.log(`📩 Sent full booking details to Provider ${providerId}`);
    } else {
      console.log(`⚠️ Provider ${providerId} is not connected`);
    }
  });
});
export { Booking };
