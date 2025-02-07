import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const SupportTicketSchema = new Schema(
  {
    ticket_id: { type: String, unique: true},
    user: { type: Types.ObjectId, ref: "User", required: true }, // FK to User

    issue: { type: String, required: true }, // User's complaint or request

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    }, // Status of the ticket

    response: { type: String, default: "" }, // Admin response (if any)

    created_at: { type: Date, default: Date.now }, // Timestamp when ticket was created
  },
  { timestamps: true, strict: false }
);

// Indexing for faster queries
SupportTicketSchema.index({ user: 1 });
SupportTicketSchema.index({ status: 1 });

const SupportTicket = model("SupportTicket", SupportTicketSchema);
export { SupportTicket };
