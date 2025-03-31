import { IBaseSchema } from "../utils/GlobalTypescript";
import { Schema, model, Types } from "mongoose";

// ✅ Define Interface for BookedSlot
interface IBookedSlot extends IBaseSchema {
  providers: Array<Types.ObjectId>; // FK to ServiceProvider
  Acutalservice: Types.ObjectId; // FK to Service
  date: Date; // Date of booking
  start_time: Date; // Start time of booking
  end_time: Date; // End time of booking
  slotTiming?: number;
  serviceoption: Types.ObjectId;
  event?: "Weekly" | "Monthly";
  reversedProvider?: Array<Types.ObjectId>;
}

// ✅ Define Mongoose Schema for BookedSlot
const BookedSlotSchema = new Schema<IBookedSlot>(
  {
    providers: [
      {
        type: Schema.Types.ObjectId,
        ref: "ServiceProvider",
        required: true,
      },
    ],
    reversedProvider: [
      {
        type: Schema.Types.ObjectId,
        ref: "ServiceProvider",
      },
    ],
    Acutalservice: {
      type: Schema.Types.ObjectId,
      ref: "ActualService",
      required: true,
    },
    serviceoption: {
      type: Schema.Types.ObjectId,
      ref: "ServiceOption",
      required: true,
    },
    date: { type: Date, required: true },
    start_time: { type: Date, required: true },
    slotTiming: { type: Number },
    event: { type: String, enum: ["Weekly", "Monthly"] },
  },
  { timestamps: true }
);

// ✅ Indexing for Optimization
BookedSlotSchema.index({ provider: 1, date: 1, start_time: 1, end_time: 1 });

// ✅ Create and Export Model
const BookedSlot = model<IBookedSlot>("BookedSlot", BookedSlotSchema);

export { BookedSlot };
