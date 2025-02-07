import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;
const BookedSlotSchema = new Schema(
    {
      provider: { type: Types.ObjectId, ref: "ServiceProvider", required: true }, // FK to Service Provider
      service: { type: Types.ObjectId, ref: "Service", required: true }, // FK to Service
      date: { type: Date, required: true }, // Date of the booking
      start_time: { type: String, required: true }, // Start time
      end_time: { type: String, required: true }, // End time
      booking_id: { type: Types.ObjectId, ref: "Booking", required: true }, // FK to Booking
    },
    { timestamps: true }
  );
  
  // Index for fast booked slot searches
  BookedSlotSchema.index({ provider: 1, date: 1, start_time: 1, end_time: 1 });
  
  const BookedSlot = model("BookedSlot", BookedSlotSchema);

  export { BookedSlot };