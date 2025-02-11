import mongoose from "mongoose";

const { Schema, model } = mongoose;

// Define the Service Provider Schema
const ServiceProviderSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true },
    phone: { type: String, required: true, unique: true },
    actualService: { type: Schema.Types.ObjectId, ref: "ActualService",required: true },
    image: { type: String },
    status: { 
      type: String, 
      enum: ['verified', 'unverified'], 
      default: 'unverified' 
    },
    company_name: { type: String },
    license_no: { type: String, unique: true },
    rating: { 
      type: Number, 
      default: 0.0, 
      min: 0, 
      max: 5 
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
      },
    }
  },
  { timestamps: true,strict: false } // Automatically adds createdAt and updatedAt
);

// Index for faster querying
ServiceProviderSchema.index({ email: 1 });
ServiceProviderSchema.index({ phone: 1 });
ServiceProviderSchema.index({ license_no: 1 });

const ServiceProvider = model("ServiceProvider", ServiceProviderSchema);

export default ServiceProvider;
