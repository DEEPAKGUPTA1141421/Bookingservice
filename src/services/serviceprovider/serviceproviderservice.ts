import ErrorHandler from "../../config/GlobalerrorHandler";
import { ServiceProviderAvailability } from "../../models/ServiceProviderAvailabilitySchema";
import crypto from "crypto";
import Redis from "ioredis";
import {
  create_status_return,
  OtpVerficationType,
} from "../../utils/GlobalTypescript";
import {
  addServiceProviderToRedis,
  convertStringToObjectId,
  formatToDDMMYY,
  generateOtp,
  getDistanceInMeters,
  removeServiceProviderFromRedis,
} from "../../utils/helper";
import Otp from "../../models/OtpSchema";
import { Booking } from "../../models/BookingSchema";
import { createRedisClient } from "../../config/redisCache";
import mongoose, { ObjectId } from "mongoose";
import { ServiceOption } from "../../models/ActualServiceSchema";
import { checkConsecutive, getIndex } from "../slotService";
import ServiceProvider from "../../models/ServiceProviderSchema ";
// Create a new service provider
export const createServiceProviderService = async (data: any, next: any) => {
  try {
    const newProvider = await ServiceProvider.create(data);
    if (!newProvider)
      return next(
        new ErrorHandler("Service Provider could not be created", 500)
      );
    return { id: newProvider._id };
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get all service providers
export const getAllServiceProvidersService = async (next: any) => {
  try {
    const providers = await ServiceProvider.find({});
    if (!providers.length)
      return next(new ErrorHandler("No Service Providers found", 404));
    return providers;
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get a single service provider by ID
export const getServiceProviderByIdService = async (id: string, next: any) => {
  try {
    const provider = await ServiceProvider.findById(id);
    if (!provider)
      return next(new ErrorHandler("Service Provider not found", 404));
    return provider;
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Update a service provider
export const updateServiceProviderService = async (
  id: ObjectId,
  data: any,
  next: any
) => {
  try {
    const updatedProvider = await ServiceProvider.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!updatedProvider)
      return next(new ErrorHandler("Service Provider not found", 404));
    return updatedProvider;
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Delete a service provider
export const deleteServiceProviderService = async (id: string, next: any) => {
  try {
    const deletedProvider = await ServiceProvider.findByIdAndDelete(id);
    if (!deletedProvider)
      return next(new ErrorHandler("Service Provider not found", 404));
    return { message: "Service Provider deleted successfully" };
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const getLocationFromProviderService = async (providerId: string) => {
  // Try fetching the location from Redis
  const actualService = await ServiceProvider.findById(providerId)
    .populate("actualService", "name") // Populate 'actualService' and select only 'name'
    .select("actualService"); // Ensure 'actualService' is included in the result
  const geoData = await createRedisClient().geopos(
    `geo:${actualService}`,
    providerId
  );

  if (geoData && geoData[0]) {
    // If the location is found in Redis
    const [longitude, latitude] = geoData[0];
    return {
      providerId,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    };
  }

  // Fallback to MongoDB if not found in Redis
  const serviceProvider = await ServiceProvider.findById(providerId).select(
    "address.location"
  );

  if (
    serviceProvider &&
    serviceProvider.address &&
    serviceProvider.address.location
  ) {
    // If found in MongoDB
    const { coordinates } = serviceProvider.address.location;
    return {
      providerId,
      location: {
        type: "Point",
        coordinates,
      },
    };
  }

  // If no data is found in both Redis and MongoDB
  return null;
};

export const createAvailabilityservice = async (
  data: any
): Promise<{ status: string }> => {
  try {
    const { providerId, start_time, end_time, latitude, longitude, date } =
      data;

    // Fetch service IDs for the provider
    let serviceALLId:any = await ServiceProvider.findById(providerId, {
      actualService: 1,
    }).lean();
    serviceALLId = serviceALLId?.actualService;
    console.log("serviceALLId", serviceALLId);
    if (!serviceALLId || !Array.isArray(serviceALLId)) {
      throw new ErrorHandler(
        "Invalid Data: No services found for provider",
        404
      );
    }

    console.log("in Service", serviceALLId);

    let dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0); // Midnight in local time (IST)

    // Convert to UTC manually
    const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 hours in milliseconds
    dateOnly = new Date(dateOnly.getTime() - istOffset); // Adjust back to UTC

    console.log("Final UTC Date to store:", dateOnly.toISOString());

    // Check if availability already exists
    const existingAvailability = await ServiceProviderAvailability.findOne({
      provider: providerId,
      date: dateOnly,
    });

    let obj = { status: "created" };
    let isAdd = true;
    if (existingAvailability) {
      console.log("inSide Existing");
      for (const serviceId of serviceALLId) {
        const currobj = await addServiceProviderToRedis(
          serviceId.toString(), // Convert ObjectId to string if needed
          providerId,
          latitude,
          longitude
        );
        console.log("isAdd", isAdd);
        if (!currobj) {
          isAdd = false;
        }
      }
      obj.status = "created";
      obj.status = isAdd ? "created" : "failed_to_add_in_redis";
      console.log("status check", obj, isAdd);
      return obj;
    } else {
      const availabilities = [];
      for (let i = 0; i < 4; i++) {
        // Today + next 3 days
        const date = new Date();
        date.setUTCDate(date.getUTCDate() + i); // Move to the next day
        date.setUTCHours(0, 0, 0, 0); // Ensure time is set to 00:00 UTC

        const formattedDate = date.toISOString(); // Format to "2025-03-13T00:00:00.000+00:00"

        const newAvailability = new ServiceProviderAvailability({
          provider: providerId,
          service: serviceALLId, // Ensure it's an array
          date: formattedDate, // Use the correct format
          start_time,
          end_time,
          is_active: true,
        });
        availabilities.push(newAvailability);
      }
      const insertreponse = await ServiceProviderAvailability.insertMany(
        availabilities
      );
      console.log(
        "Availability created for today and next 3 days in ISO format."
      );
      if (!insertreponse) {
        obj.status = "failed";
        return obj;
      }
      console.log("New Availability Created", insertreponse);
    }
    for (const serviceId of serviceALLId) {
      const currobj = await addServiceProviderToRedis(
        serviceId.toString(), // Convert ObjectId to string if needed
        providerId,
        latitude,
        longitude
      );

      if (!currobj) {
        isAdd = false;
      }
    }
    console.log("I am Here");
    obj.status = isAdd ? "created" : "failed_to_add_in_redis";
    console.log("status check", obj, isAdd);
    return obj;
  } catch (error: any) {
    throw new ErrorHandler(error.message || "Server Error", 501);
  }
};

export const UpdateAvailabilityService = async (
  data: any
): Promise<{ status: string }> => {
  try {
    const dateOnly = new Date();
    dateOnly.setUTCHours(0, 0, 0, 0);

    const { providerId, latitude, longitude } = data;
    console.log("Received data:", { providerId, latitude, longitude });

    const obj = { status: "updated" };

    // Fetch service provider details
    const serviceALLId:any = await ServiceProvider.findById(providerId, {
      serviceId: 1,
    }).lean();

    if (
      !serviceALLId ||
      !Array.isArray(serviceALLId.serviceId) ||
      serviceALLId.serviceId.length === 0
    ) {
      throw new ErrorHandler("Invalid provider or no associated services", 404);
    }

    const serviceIds = serviceALLId.serviceId.map((id:any) => id.toString());

    // Check if availability exists
    const existingAvailability = await ServiceProviderAvailability.findOne({
      provider: providerId,
      date: dateOnly,
    });

    if (!existingAvailability) {
      console.log("No existing availability found for provider:", providerId);
      obj.status = "not_exists";
      return obj;
    }

    console.log("Existing Availability:", existingAvailability);

    const isCurrentlyActive = existingAvailability.is_active;

    if (!isCurrentlyActive) {
      console.log("Activating service in Redis...");

      let isAddSuccess = true;
      for (const serviceId of serviceIds) {
        const isAdded = await addServiceProviderToRedis(
          serviceId,
          providerId.toString(),
          latitude,
          longitude
        );
        if (!isAdded) isAddSuccess = false;
      }

      if (!isAddSuccess) {
        obj.status = "failed_to_add_in_redis";
        return obj;
      }

      existingAvailability.is_active = true;
    } else {
      console.log("Deactivating service from Redis...");

      let isRemoveSuccess = true;
      for (const serviceId of serviceIds) {
        const isRemoved = await removeServiceProviderFromRedis(
          providerId.toString(),
          serviceId.toString()
        );
        if (!isRemoved) isRemoveSuccess = false;
      }

      if (!isRemoveSuccess) {
        obj.status = "failed_to_remove_from_redis";
        return obj;
      }

      existingAvailability.is_active = false;
    }

    await existingAvailability.save();
    console.log("Availability updated successfully:", existingAvailability);

    return obj;
  } catch (error: any) {
    console.error("Error in UpdateAvailabilityService:", error);
    throw new ErrorHandler(error.message || "Internal Server Error", 501);
  }
};

export const reachedAtUserLocationService = async (
  data: OtpVerficationType
): Promise<create_status_return> => {
  try {
    const { providerLat, providerLon, bookingId, userid } = data;
    const booking = await Booking.findById(bookingId, {
      "address.location.coordinates": 1,
      _id: 0,
    }).lean();
    if (
      !booking ||
      !booking.address ||
      !booking.address.location ||
      !booking.address.location.coordinates
    ) {
      throw new ErrorHandler("Booking Not Found", 404);
    }
    let userLat = booking?.address.location.coordinates[0],
      userLon = booking?.address.location.coordinates[1];
    const distance = getDistanceInMeters(
      userLat,
      userLon,
      providerLat,
      providerLon
    );
    const arrivalThreshold = 10;
    let reached: boolean = distance <= arrivalThreshold;
    if (!reached) {
      return { status: "not reached" };
    }
    const otp = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await Otp.create({
      user_id: userid,
      otp_code: hashedOtp,
      expires_at: expiresAt,
      typeOfOtp: "reached",
    });
    return { status: "not reached" };
  } catch (error: any) {
    throw new ErrorHandler(error.message, 501);
  }
};

export const getNearbyServiceProviders = async (
  latitude: number,
  longitude: number,
  radius: number,
  serviceId: string,
  date: string
) => {
  console.log("date i am getting at service", date);
  const dateOnly = new Date(date);
  dateOnly.setUTCHours(0, 0, 0, 0); // Normalize date to midnight UTC
  const serviceProviders = await ServiceProvider.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [latitude, longitude], // Correct order: [longitude, latitude]
        },
        distanceField: "distance",
        query: { actualService: { $in: [convertStringToObjectId(serviceId)] } },
        maxDistance: radius, // Radius in meters
        includeLocs: "dist.location",
        spherical: true,
      },
    },
  ]);
  console.log("wow serviceProviders", serviceProviders);
  const providerIds = serviceProviders.map((provider) => provider._id);
  console.log("serviceProviders 2",providerIds);
  const providerAvailabilities = await ServiceProviderAvailability.find(
    {
      provider: { $in: providerIds },
      date: dateOnly,
    },
    { provider: 1, available_bit: 1 }
  ).lean();
  let returnProviders: {
    providerId: string;
    availableDurations: Object[];
  }[] = [];
  const now = new Date(date);
  const currentTime = formatTime(now);
  const timeIndex = getIndex(currentTime);
  const serviceOption = await ServiceOption.find({
    actualService: convertStringToObjectId(serviceId),
  }).lean();
  console.log("provider length", providerAvailabilities.length);
  if (!providerAvailabilities.length) {
  } else {
    for (let i = 0; i < providerAvailabilities.length; i++) {
      let availableDurations: Object[] = [];

      // Check each duration in the duration array
      for (let j = 0; j < serviceOption.length; j++) {
        let d = serviceOption[j].duration;
        d /= 15;
        if (
          checkConsecutive(
            providerAvailabilities[i].available_bit,
            timeIndex,
            d
          )
        ) {
          console.log("yes null value");
          availableDurations.push({
            serviceoption: {
              ...serviceOption[j],
              providerId: providerAvailabilities[i].provider.toString(),
            },
          }); // Convert slots to minutes
        } else {
          availableDurations.push({
            serviceoption: {
              ...serviceOption[j],
              providerId: null,
            },
          }); // Convert slots to minutes
        }
      }

      if (availableDurations.length > 0) {
        returnProviders.push({
          providerId: providerAvailabilities[i].provider.toString(),
          availableDurations,
        });
      }
    }
  }
  console.log("last returnProviders", returnProviders);
  return returnProviders;
};

export const formatTime = (date: Date): string => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  console.log(hours, minutes);
  if (minutes <= 30) {
    minutes = 0;
  } else {
    minutes = 30;
  }

  return `${hours}:${minutes === 0 ? "00" : "30"}`;
};
