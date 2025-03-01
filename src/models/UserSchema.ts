import mongoose from "mongoose";
import { IBaseSchema } from "../utils/GlobalTypescript";
import { getAddressFromLatLng } from "../services/locationservice";

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

export interface IUser extends IBaseSchema {
  name?: string;
  email?: string;
  phone: string;
  role: "user" | "provider" | "admin";
  status: "verified" | "unverified";
  image?: string;
  address?: IAddress;
  current_address: string;
  listofAddress: string[];
  distance_current_address:string
}
const UserSchema = new Schema<IUser>(
  {
    name: String,
    email: { type: String, unique: true, sparse: true, default: null },
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
      current_address: { type: String, default: "" }, // ✅ Moved out of `address`
      listofAddress: { type: [String], default: [] }, // ✅ Moved out of `address`
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    strict: false, // Allows additional fields not defined in schema
  }
);

// ✅ Geospatial index applied only if "coordinates" exist
UserSchema.index({ "address.location": "2dsphere" }, { sparse: true });

UserSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;

  if (update?.["address.location"]?.coordinates) {
    console.log("yes Update");
    const [longitude, latitude] = update["address.location"].coordinates;
    console.log("corr check", longitude, latitude);
    try {
      const fullAddress = await getAddressFromLatLng(latitude, longitude);

      if (fullAddress) {
        console.log("check full",fullAddress);
        update.current_address = fullAddress; // ✅ Now updates at root level

        if (!update.listofAddress) {
          update.listofAddress = [];
        }
        update.listofAddress.unshift(fullAddress); // ✅ Now modifies root-level `listofAddress`
      }
    } catch (error) {
      console.error("Google API Error:", error);
    }
  }
 if (update.add_address) {
   console.log("✅ Adding new address:", update.add_address);

   // Ensure listofAddress is an array
   const newAddress = update.add_address.trim();

   // ✅ Check if the new address is already in the list
   if (!update.listofAddress.includes(newAddress)) {
     console.log("adding one more");
     update.listofAddress.push(newAddress);
   }

   // ✅ Ensure the array does not exceed a limit (e.g., store only the last 5 addresses)
   if (update.listofAddress.length > 5) {
     update.listofAddress.pop(); // Remove the oldest entry
   }

   // ❌ Remove `add_address` so it is NOT stored in the database
   delete update.add_address;
 }

  next();
});

const User = model<IUser>("User", UserSchema);
export default User;
