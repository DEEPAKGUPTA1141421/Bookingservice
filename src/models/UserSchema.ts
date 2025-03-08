import mongoose from "mongoose";
import { IBaseSchema } from "../utils/GlobalTypescript";
import { getAddressFromCordinate, getAddressFromLatLng } from "../services/locationservice";

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

interface location_return{
  latitude?: number | any,
  longitude?:number |any
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
  distance_current_address: string
  points:string
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
    points:{type:String, default:"0"},
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

  // ✅ Handling `address.location.coordinates`
  if (update?.["address.location"]?.coordinates) {
    console.log("✅ Updating location with coordinates");

    const [longitude, latitude] = update["address.location"].coordinates;
    console.log("✔ Coordinates received:", longitude, latitude);

    try {
      const fullAddress = await getAddressFromLatLng(latitude, longitude);
      const existingDoc = await this.model
        .findOne(this.getQuery())
        .select("listofAddress")
        .lean();

      let addressArray: string[] = Array.isArray(existingDoc?.listofAddress)
        ? existingDoc.listofAddress
        : [];

      if (!addressArray.includes(fullAddress)) {
        console.log("✔ Adding new address:", fullAddress);
        addressArray.unshift(fullAddress); // Push to the beginning
      }

      // ✅ Ensure list does not exceed 5 entries
      if (addressArray.length > 5) {
        addressArray = addressArray.slice(0, 5);
      }

      // ✅ Assign updated array and current address
      update.listofAddress = addressArray;
      update.current_address = fullAddress; // ✅ Updates root-level field
    } catch (error) {
      console.error("❌ Google API Error:", error);
    }
  }

  // ✅ Handling `add_address` field
  if (update.add_address) {
    console.log("✅ Processing add_address:", update.add_address);

    try {
      console.log("update add ress text",update.add_address);
      let response: any = await getAddressFromCordinate(update.add_address);
      const { lat, lon } = response;

      console.log("sedinhgjhbdksbhjh", lat, lon,response);

      if (lon !== undefined && lat !== undefined) {
        update.address = update.address || {}; // Ensure address object exists
        update.address.location = {
          type: "Point",
          coordinates: [lat, lon], // ✅ MongoDB requires [longitude, latitude]
        };
      }

      const existingDoc = await this.model
        .findOne(this.getQuery())
        .select("listofAddress")
        .lean();

      let addressArray: string[] = Array.isArray(existingDoc?.listofAddress)
        ? existingDoc.listofAddress
        : [];

      const newAddress = update.add_address.trim();

      // ✅ Avoid duplicates
      if (!addressArray.includes(newAddress)) {
        console.log("✔ Adding new address:", newAddress);
        addressArray.unshift(newAddress);
      }

      // ✅ Ensure list does not exceed 5 entries
      if (addressArray.length > 5) {
        addressArray = addressArray.slice(0, 5);
      }

      // ✅ Assign updated array and set current_address
      update.listofAddress = addressArray;
      update.current_address = newAddress;

      // ❌ Remove `add_address` so it's NOT stored in the database
      delete update.add_address;
    } catch (error) {
      console.error("❌ Address Lookup Error:", error);
    }
  }

  next();
});






const User = model<IUser>("User", UserSchema);
export default User;
