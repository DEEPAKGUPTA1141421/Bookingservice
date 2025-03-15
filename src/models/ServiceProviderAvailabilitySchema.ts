import { IBaseSchema } from "../utils/GlobalTypescript";
import mongoose, { Document, Types, Schema } from "mongoose";
import { getdateTypeForMongoose } from "../utils/helper";
const dateOnly = new Date();
dateOnly.setUTCHours(0, 0, 0, 0);
// ✅ Define Interface for ServiceProviderAvailability
export interface IServiceProviderAvailability extends IBaseSchema {
  provider: Types.ObjectId; // Reference to ServiceProvider
  service: Types.ObjectId; // Reference to Service
  date: Date; // Date of availability
  start_time: string; // Start time of work
  end_time: string; // End time of work
  is_active: boolean; // Active status of availability
  available_bit:string
}

// Define Mongoose Schema for ServiceProviderAvailability
const ServiceProviderAvailabilitySchema =
  new mongoose.Schema<IServiceProviderAvailability>(
    {
      provider: {
        type: Schema.Types.ObjectId,
        ref: "ServiceProvider",
        required: true,
      },
      service: [{
        type: Schema.Types.ObjectId,
        ref: "Service",
        required: true,
      }],
      date: {
        type: Date,
        required: true,
      },
      start_time: { type: String, required: true },
      end_time: { type: String, required: true },
      is_active: { type: Boolean, default: true },
      available_bit: {
        type: String,
        default:
          "111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111",
      },
    },
    { timestamps: true }
  );

const calculateAvailableBits = (
  start_time: string,
  end_time: string
): number => {
  const startHour = parseInt(start_time.split(":")[0], 10);
  const endHour = parseInt(end_time.split(":")[0], 10);

  // Each hour has 2 slots (30 minutes each)
  const slots = (endHour - startHour) * 2;

  // Generate bitmask (Example: 6 slots -> 111111 in binary)
  return (1 << slots) - 1;
};

// Indexing for fast querying
ServiceProviderAvailabilitySchema.index({ provider: 1, date: 1 });

// Define Model
const ServiceProviderAvailability = mongoose.model<IServiceProviderAvailability>("ServiceProviderAvailability", ServiceProviderAvailabilitySchema);

export { ServiceProviderAvailability };
