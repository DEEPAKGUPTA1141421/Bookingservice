import ErrorHandler from "../../config/GlobalerrorHandler";
import { ServiceProviderAvailability } from "../../models/ServiceProviderAvailabilitySchema";
import ServiceProvider from "../../models/ServiceProviderSchema ";
import crypto from "crypto";
import Redis from "ioredis";
import { create_status_return, OtpVerficationType } from "../../utils/GlobalTypescript";
import {
  addServiceProviderToRedis,
  formatToDDMMYY,
  generateOtp,
  getDistanceInMeters,
  removeServiceProviderFromRedis,
} from "../../utils/helper";
import Otp from "../../models/OtpSchema";
import { Booking } from "../../models/BookingSchema";
import { createRedisClient } from "../../config/redisCache";
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
    } = data;
    console.log("in Service", data);
    const dateOnly = new Date();
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
        const isRemove: any = await removeServiceProviderFromRedis(
          providerId,
          serviceId
        );
        isRemove == true
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
