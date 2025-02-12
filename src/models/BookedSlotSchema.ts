import { IBaseSchema } from "../utils/GlobalTypescript";
import { Schema, model, Types } from "mongoose";

// ✅ Define Interface for BookedSlot
interface IBookedSlot extends IBaseSchema {
  provider: Types.ObjectId; // FK to ServiceProvider
  service: Types.ObjectId; // FK to Service
  date: Date; // Date of booking
  start_time: string; // Start time of booking
  end_time: string; // End time of booking
  booking_id: Types.ObjectId; // FK to Booking
}

// ✅ Define Mongoose Schema for BookedSlot
const BookedSlotSchema = new Schema<IBookedSlot>(
  {
    provider: { type: Schema.Types.ObjectId, ref: "ServiceProvider", required: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    date: { type: Date, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    booking_id: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  },
  { timestamps: true }
);

// ✅ Indexing for Optimization
BookedSlotSchema.index({ provider: 1, date: 1, start_time: 1, end_time: 1 });

// ✅ Create and Export Model
const BookedSlot = model<IBookedSlot>("BookedSlot", BookedSlotSchema);

export { BookedSlot };
