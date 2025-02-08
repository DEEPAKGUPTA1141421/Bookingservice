import mongoose from "mongoose";

const { Schema, model } = mongoose;
interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  location?: {
    type: "Point";
    coordinates: [number, number]; // Longitude, Latitude
  };
}

interface IUser extends Document {
  name?: string;
  email?: string;
  phone: string;
  role: "user" | "provider" | "admin";
  status: "verified" | "unverified";
  image?: string;
  address?: IAddress;
}
const UserSchema = new Schema<IUser>(
  {
    name: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true, required: true },
    role: {
      type: String,
      enum: ["user", "provider", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["verified", "unverified"],
      default: "unverified",
    },
    image: { type: String },
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
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    strict: false, // Allows additional fields not defined in schema
  }
);

// ✅ Geospatial index applied only if "coordinates" exist
UserSchema.index({ "address.location": "2dsphere" }, { sparse: true });

const User = model("User", UserSchema);
export default User;
