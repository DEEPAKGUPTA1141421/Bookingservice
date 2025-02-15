import ErrorHandler from "../../config/GlobalerrorHandler";
import ServiceProvider from "../../models/ServiceProviderSchema ";


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

import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost");

export const getLocationFromProviderService = async (providerId: string) => {
  // Try fetching the location from Redis
  const actualService = await ServiceProvider.findById(providerId)
    .populate("actualService", "name") // Populate 'actualService' and select only 'name'
    .select("actualService"); // Ensure 'actualService' is included in the result
  const geoData = await redisClient.geopos(`geo:${actualService}`, providerId);

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

