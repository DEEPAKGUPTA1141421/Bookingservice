import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true, required: true },
    role: { type: String, enum: ["user", "provider", "admin"], default: "user" },
    status: { type: String, enum: ["verified", "unverified"], default: "unverified" },
    image:{type:String},
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
      },
    },
  },
  { 
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    strict: false // Allows additional fields not defined in schema
  }
);

// Indexing
UserSchema.index({ "address.location": "2dsphere" }); // Geospatial index
UserSchema.index({ _id: 1 }); // Explicitly indexing _id

const User = mongoose.model("User", UserSchema);
export default User;
