import ErrorHandler from "../../config/GlobalerrorHandler";
import { ServiceProviderAvailability } from "../../models/ServiceProviderAvailabilitySchema";
import ServiceProvider, { IServiceProvider } from "../../models/ServiceProviderSchema ";
import crypto from "crypto";
import Redis from "ioredis";
import { create_status_return, OtpVerficationType } from "../../utils/GlobalTypescript";
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
// Create a new service provider
export const createServiceProviderService = async (data: any, next: any) => {
  try {
    const newProvider = await ServiceProvider.create(data);
    if (!newProvider) return next(new ErrorHandler("Service Provider could not be created", 500));
    return { id: newProvider._id };
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get all service providers
export const getAllServiceProvidersService = async (next: any) => {
  try {
    const providers = await ServiceProvider.find({});
    if (!providers.length) return next(new ErrorHandler("No Service Providers found", 404));
    return providers;
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get a single service provider by ID
export const getServiceProviderByIdService = async (id: string, next: any) => {
  try {
    const provider = await ServiceProvider.findById(id);
    if (!provider) return next(new ErrorHandler("Service Provider not found", 404));
    return provider;
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Update a service provider
export const updateServiceProviderService = async (id: string, data: any, next: any) => {
  try {
    const updatedProvider = await ServiceProvider.findByIdAndUpdate(id, data, { new: true });
    if (!updatedProvider) return next(new ErrorHandler("Service Provider not found", 404));
    return updatedProvider;
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Delete a service provider
export const deleteServiceProviderService = async (id: string, next: any) => {
  try {
    const deletedProvider = await ServiceProvider.findByIdAndDelete(id);
    if (!deletedProvider) return next(new ErrorHandler("Service Provider not found", 404));
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

export const createAvailabilityservice = async (data: any): Promise<create_status_return> => {
  try {
    const {
      providerId,
      serviceId,
      start_time,
      end_time,
      latitude,
      longitude,
      date
    } = data;
    console.log("in Service", data);
    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);
    // Check if availability exists
    console.log("providerId", providerId);
    console.log(typeof(providerId));
    const existingAvailability = await ServiceProviderAvailability.findOne({
      provider: providerId,
      date: dateOnly,
    });
    
    let obj = { status: "created" };
    console.log("existing", existingAvailability);
    if (existingAvailability) {
      obj.status="exists";
      return obj;
    } else {
      const newavailable = await ServiceProviderAvailability.create({
        provider: providerId,
        service: serviceId,
        date: dateOnly,
        start_time,
        end_time,
        is_active: true,
      });
      if (!newavailable) {
        obj.status = "failed"; 
      }
      const isAdd = await addServiceProviderToRedis(serviceId, providerId, latitude, longitude);
      isAdd === true
        ? (obj.status = "created")
        : (obj.status = "failed_to add_in_redis");
      return obj;
    }
  }
  catch (error: any) {
    throw new ErrorHandler(error.message, 501);
  }
};

export const UpdateAvailabilityService = async (
  data: any
): Promise<create_status_return> => {
  try {
    const dateOnly = new Date();
    dateOnly.setUTCHours(0, 0, 0, 0);
    const { providerId, serviceId, latitude, longitude } = data;
    console.log("data", latitude, longitude);
    const obj = { status: "updated" };
    // Check if availability exists
    const existingAvailability = await ServiceProviderAvailability.findOne({
      provider: providerId,
      service: serviceId,
      date: dateOnly,
    });

    if (existingAvailability) {
      console.log("value", existingAvailability);
    }

    if (!existingAvailability) {
      obj.status = "not_exits";
      return obj;
    } else {
      console.log("else")
      const toggle = existingAvailability.is_active;
      console.log("toggle", toggle);
      if (toggle == false) {
        console.log("in if")
        const isAdd: any = await addServiceProviderToRedis(
          serviceId,
          providerId,
          latitude,
          longitude
        );
        isAdd == true
          ? (obj.status = "failed_to add_in_redis")
          : (obj.status = "updated");
        existingAvailability.is_active = true
      } else {
        console.log("providerId", providerId);
        console.log("serviceId", serviceId);
        const isRemove: any = await removeServiceProviderFromRedis(
          providerId,
          serviceId
        );
        isRemove == false
          ? (obj.status = "failed_to remove_from_redis")
          : (obj.status = "updated");
        existingAvailability.is_active = false
      }
      await existingAvailability.save();
      return obj;
    }
  }
  catch (error: any) {
    throw new ErrorHandler(error.message, 501);
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
  const dateOnly = new Date(date);
  dateOnly.setUTCHours(0, 0, 0, 0); // Normalize date to midnight UTC
  console.log(latitude, longitude, radius, serviceId, date);
  const serviceProviders = await ServiceProvider.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [latitude, longitude], // Correct order: [longitude, latitude]
        },
        distanceField: "distance",
        query: { actualService: convertStringToObjectId(serviceId) },
        maxDistance: radius, // Radius in meters
        includeLocs: "dist.location",
        spherical: true,
      },
    },
  ]);
  console.log(serviceProviders);
  const providerIds = serviceProviders.map((provider) => provider._id);
  console.log(providerIds);
  const providerAvailabilities = await ServiceProviderAvailability.find(
    {
      provider: { $in: providerIds },
      date: dateOnly,
      is_active: true,
    },
    { provider: 1, available_bit: 1 }
  ).lean();
  console.log(providerAvailabilities);
  let returnProviders: {
    providerId: string;
    availableDurations: Object[];
  }[] = [];
  const now = new Date(date);
  const currentTime = formatTime(now);
  const timeIndex = getIndex(currentTime);
  const serviceOption = await ServiceOption.find({
    actualService: convertStringToObjectId(serviceId),
  });

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
          availableDurations.push({
            duration: d * 15,
            serviceoption: serviceOption[j],
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
