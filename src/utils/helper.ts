import { NextFunction } from "express";
import ErrorHandler from "../config/GlobalerrorHandler";
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



