import { NextFunction } from "express";
import ErrorHandler from "../config/GlobalerrorHandler";
import mongoose, { Types } from "mongoose";
import { z } from "zod";
import Redis from "ioredis";
export const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost");
export const CheckZodValidation=(body:any,schema:any,next:NextFunction)=>{
  const validation=schema.safeParse(body);
  if(!validation.success){
    const errorMessage = validation.error.errors.map((err: any) => `${err.path.join(".")}: ${err.message}`) .join(", ");
    throw new ErrorHandler(errorMessage, 504)
  }
  return validation;
}
// Function to get all service providers within a given radius (in kilometers)
async function getProvidersWithinRadius(
  referenceLongitude: number,
  referenceLatitude: number,
  radiusInKm: number,
  actualService: string
) {
  try {
    // Use GEORADIUS to get the service providers within the radius
    const nearbyProviders = await redisClient.georadius(
      `geo:${actualService}`,
      referenceLongitude,
      referenceLatitude,
      radiusInKm,
      "km",
      "WITHCOORD"
    );


    if (nearbyProviders.length === 0) {
      console.log(`No service providers found within ${radiusInKm} km.`);
      return [];
    }

    // Return list of providers (providerId)
    return nearbyProviders
  } catch (error) {
    console.error("Error fetching service providers:", error);
    throw error;
  }
}

// Example usage:
const getnearestSrviceProvider = async (Longitude: number = -122.4194,Latitude:number =37.7749, radiusInKm:number=5,actualService:string ) => {
  const serviceProviders = await getProvidersWithinRadius(
    Longitude,
    Latitude,
    radiusInKm,
    actualService
  );
  console.log(serviceProviders);
  return serviceProviders;
};



export const generateAvailableSlots = (
  start: string,
  end: string,
  booked: { start: string; end: string }[]
) => {
  const slots: string[] = [];
  let current = start;

  while (current < end) {
    const nextSlot = addMinutes(current, 30);
    if (!booked.some((slot) => isOverlapping(current, nextSlot, slot))) {
      slots.push(current);
    }
    current = nextSlot;
  }

  return slots;
};

export const isOverlapping = (
  start: string,
  end: string,
  bookedSlot: { start: string; end: string }
) => {
  return start < bookedSlot.end && end > bookedSlot.start;
};

export const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toTimeString().substring(0, 5);
};

export async function addServiceProviderToRedis(
  providerId: string,
  serviceId: string,
  latitude: number,
  longitude: number
):Promise<boolean> {
  const key = `service_providers:${serviceId}`;
  console.log("adding it to redis now with key",key);
  console.log(typeof (latitude), typeof (longitude));
  console.log(key, longitude, latitude, providerId);
  const result= await redisClient.zrem(key, providerId.toString());
  console.log("removed",result);
  const add=await redisClient.geoadd(
    key,
    Number(longitude),
    Number(latitude),
    String(providerId)
  );
  console.log("added",add);
  if (add) return true;
  else return false;
}


export async function removeServiceProviderFromRedis(
  providerId: string,
  serviceId: string
):Promise<boolean> {
  const key = `service_providers:${serviceId}`;

  const removed = await redisClient.zrem(key, providerId.toString());
  if (removed) {
    return true;
  } else {
    return false;
  }
}


export async function getAvailableProvidersFromRedis(
  serviceId: Types.ObjectId,
  latitude: number,
  longitude: number,
  radius: number
): Promise<string[]> {
  const key = `service_providers:${serviceId}`;
  const providers = await redisClient.geosearch(
    key,
    "FROMLONLAT",
    longitude,
    latitude,
    "BYRADIUS",
    radius,
    "km",
    "ASC" // Sort by nearest first
  );

  return (providers as string[]) || [];
}

export const objectIdSchema = z
  .string()
  .min(1, "ObjectId is required")
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  })
  .transform((val) => new mongoose.Types.ObjectId(val));


export const formatToDDMMYY = (date: Date): string => {
  const formattedDate = date.toISOString().split("T")[0];
  const [year, month, day] = formattedDate.split("-");
  return `${day}-${month}-${year.slice(2)}`; // "17-02-25"
};  

export const getdateTypeForMongoose = () => {
   const dateOnly = new Date();
  dateOnly.setUTCHours(0, 0, 0, 0);
  return dateOnly
}

export const generateUpcomingTimeSlots = (endTime:string) => {
  const slots:string[] = [];
  const now = new Date();
  console.log(now.getMinutes());
  console.log(now.getHours());
  console.log(now.getSeconds());

  // Round to the next 30-minute mark
  now.setMinutes(now.getMinutes() + (30 - (now.getMinutes() % 30)), 0, 0);

  const end = new Date();
  end.setHours(
    Number(endTime.split(":")[0]),
    Number(endTime.split(":")[1]),
    0,
    0
  );

  while (now <= end) {
    slots.push(now.toTimeString().slice(0, 5)); // Extract HH:MM format
    now.setMinutes(now.getMinutes() + 30);
  }

  console.log("slots", slots);
  return slots;
};
