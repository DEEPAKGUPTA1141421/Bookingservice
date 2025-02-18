import { number } from "zod";
import { IBaseSchema } from "../utils/GlobalTypescript";
import { Schema, model, Types } from "mongoose";

// ✅ Define Interface for BookedSlot
interface IBookedSlot extends IBaseSchema {
  provider: Types.ObjectId; // FK to ServiceProvider
  service: Types.ObjectId; // FK to Service
  date: Date; // Date of booking
  start_time: Date; // Start time of booking
  end_time: Date; // End time of booking
  slotTiming: number;
}

// ✅ Define Mongoose Schema for BookedSlot
const BookedSlotSchema = new Schema<IBookedSlot>(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
    },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    date: { type: Date, required: true },
    start_time: { type: Date, required: true },
    end_time:{type: Date, required: true},
    slotTiming: { type: Number, required: true },
  },
  { timestamps: true }
);

// ✅ Indexing for Optimization
BookedSlotSchema.index({ provider: 1, date: 1, start_time: 1, end_time: 1 });

// ✅ Create and Export Model
const BookedSlot = model<IBookedSlot>("BookedSlot", BookedSlotSchema);

export { BookedSlot };
