import mongoose from "mongoose";
const adminSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", adminSchema);
export { Admin };

