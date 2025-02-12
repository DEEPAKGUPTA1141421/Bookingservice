import { IBaseSchema } from "../utils/GlobalTypescript";
import mongoose, { Document, Types, Schema } from "mongoose";

// ✅ Define the Interface for SupportTicket Schema
export interface ISupportTicket extends IBaseSchema {
  ticket_id: string;
  user: Types.ObjectId; // Reference to User
  booking: Types.ObjectId; // Reference to Booking
  issue: string; // Complaint or Request
  status: "open" | "in_progress" | "resolved" | "closed"; // Status of the ticket
  response?: string; // Admin's response (optional)
  created_at: Date; // Timestamp of ticket creation
}

// Define Mongoose Schema for SupportTicket
const SupportTicketSchema = new mongoose.Schema<ISupportTicket>(
  {
    ticket_id: { type: String, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    issue: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    response: { type: String, default: "" },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true, strict: false }
);

// Indexing for faster queries
SupportTicketSchema.index({ user: 1 });
SupportTicketSchema.index({ status: 1 });

// Define the Model
const SupportTicket = mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);

export { SupportTicket };
