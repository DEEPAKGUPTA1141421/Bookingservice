import { Request, Response, NextFunction, response } from "express";
import { createServiceProviderService, getAllServiceProvidersService, getServiceProviderByIdService, updateServiceProviderService, deleteServiceProviderService, getLocationFromProviderService, UpdateAvailabilityService, createAvailabilityservice, reachedAtUserLocationService } from "../../services/serviceprovider/serviceproviderservice";
import { sendResponse } from "../../utils/responseHandler";
import { CheckZodValidation, convertStringToObjectId, getAvailableProvidersFromRedis } from "../../utils/helper";
import ErrorHandler from "../../config/GlobalerrorHandler";
import { createAvailabilitySchema, createServiceProviderSchema, otpVerificationatUserLocationSchema, UpdateAvailabilitySchema, updateServiceProviderSchema } from "../../validations/service_provider_validation";
import { create_status_return } from "../../utils/GlobalTypescript";
import { COOKIE_OPTIONS, generateToken } from "../authController";
import crypto from "crypto";
import User from "../../models/UserSchema";
import Otp from "../../models/OtpSchema";
import { verifyOtpSchema } from "../../validations/authcontroller_validation";
import { Booking } from "../../models/BookingSchema";
import { checkConsecutive, getIndex } from "../../services/slotService";
import { ServiceProviderAvailability } from "../../models/ServiceProviderAvailabilitySchema";
import mongoose from "mongoose";
// Create a new service provider
export const createServiceProvider = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
  try {
    console.log(req.file); 
    const profilePicture = req.file as Express.MulterS3.File | undefined;
    if (!profilePicture || !profilePicture.location) {
        next(new ErrorHandler("At least one image is required", 400));
        return;
    }
    console.log(req.body);  
    const validation = CheckZodValidation({ ...req.body, image: profilePicture.location }, createServiceProviderSchema, next);
    if (!validation.success) {
       next(new ErrorHandler("validation failed", 500));
      return;
    }
    const response = await createServiceProviderService(validation.data, next);
    sendResponse(res, 201, "Service Provider Created Successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get all service providers
export const getAllServiceProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getAllServiceProvidersService(next);
    sendResponse(res, 200, "Service Providers retrieved successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get a single service provider by ID
export const getServiceProviderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getServiceProviderByIdService(req.params.id, next);
    sendResponse(res, 200, "Service Provider retrieved successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Update a service provider
export const updateServiceProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profilePicture = req.file as Express.MulterS3.File | undefined;
    if (!profilePicture || !profilePicture.location) {
      next(new ErrorHandler("At least one image is required", 400));
      return;
    }
    const validation = CheckZodValidation({ ...req.body,image:profilePicture.location }, updateServiceProviderSchema, next);
    if (!validation.success) return;
    const response = await updateServiceProviderService(req.params.id, validation.data, next);
    sendResponse(res, 200, "Service Provider Updated Successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Delete a service provider
export const deleteServiceProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await deleteServiceProviderService(req.params.id, next);
    sendResponse(res, 200, "Service Provider Deleted Successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};


export const getServiceProviderLocation = async (req: Request,res: Response,next: NextFunction):Promise<void> => {
  const { id } = req.params;
  try {
    const location = await getLocationFromProviderService(id);
    if (!location) {
      sendResponse(res,200,"Service Provider Location retrieved successfully",location);  
      return;
    }
  next(new ErrorHandler("Service Provider Location not found", 404));
  } catch (error:any) {
    next(new ErrorHandler(error.message, 404));
  }
};

export const createAvailability = async (req: Request, res: Response,next:NextFunction):Promise<void> => {
  try {
    const validatedData = CheckZodValidation(req.body, createAvailabilitySchema, next);
    if (!validatedData.success) {
      next(new ErrorHandler("Validation failed", 500));
      return;
    }
    const response: create_status_return = await createAvailabilityservice(validatedData.data);
    if (response.status != "created" && response.status != "exists") {
      next(new ErrorHandler("Availability could not be created", 501));
      return;
    } else {
      sendResponse(res, 201, "Availability created successfully", response);
    }
  } catch (error:any) {
    next(new ErrorHandler(error.message, 501));
  }
};

export const updateAvailability = async (req: Request, res: Response,next:NextFunction) => {
  try {
    const validatedData = CheckZodValidation(req.body, UpdateAvailabilitySchema, next);
    if (!validatedData.success) {
      next(new ErrorHandler("Validation failed", 500));
      return;
    }
    console.log("in controller",validatedData.data);
    const response:create_status_return = await UpdateAvailabilityService(validatedData.data);
    if (response.status == "exists"){
      sendResponse(res, 302, "Availability already exists", response);
      return; 
    }
    else {
      sendResponse(res, 201, "Availability updated successfully", response);
    }
  } catch (error:any) {
    next(new ErrorHandler(error.message, 501));
  }
};

export const reachedAtUserLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = CheckZodValidation(
      req.body,
      otpVerificationatUserLocationSchema,
      next
    );

    if (!validatedData.success) {
      next(new ErrorHandler("Validation failed", 500));
      return;
    }
    const response: create_status_return =
      await reachedAtUserLocationService(validatedData.data);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 501));
  }
};

export const OtpVerifyAtUserLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {  otp,userId,bookingId } = req.body;

    const latestOtp = await Otp.findOne({
      user_id: userId,
      is_used: false,
    }).sort({ createdAt: -1 });
    if (!latestOtp || new Date(latestOtp.expires_at) < new Date())
      return next(new ErrorHandler("OTP expired or invalid", 400));

    const hashedInputOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    if (hashedInputOtp !== latestOtp.otp_code)
      return next(new ErrorHandler("Invalid OTP", 400));
    await Otp.updateOne({ _id: latestOtp._id }, { is_used: true });
    const booking = await Booking.findById(bookingId, { status: 1 });
    if (!booking) {
      next(new ErrorHandler("Booking Not Found", 404));
      return;
    }
    booking.status = 'verified';
    await booking?.save();
    sendResponse(res, 200, "OTP verified successfully",{});
  } catch (error) {
    const err = error as Error;
    next(new ErrorHandler(err.message, 400));
  }
};


export const getProvidersWithinRadius = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let { latitude, longitude, radius, serviceId } = req.body;
    console.log("new one log",latitude,longitude,radius,serviceId);
    const duration = [2, 3, 4, 5, 6]; // 30, 45, 60, 75, 90 minutes slots

    if (!serviceId || !latitude || !longitude || !radius) {
      res.status(404).json({ error: "Missing required parameters" });
      return;
    }

    // Fetch available providers from Redis
    const providers = await getAvailableProvidersFromRedis(
      serviceId,
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      radius
    );
    console.log(providers);
    serviceId = convertStringToObjectId(serviceId);
    const now = new Date();
    const currentTime = formatTime(now);
    const timeIndex = getIndex(currentTime);

    // Fetch provider availability from MongoDB
    const providerAvailabilities = await ServiceProviderAvailability.find(
      {
        provider: {
          $in: providers.map(
            (provider: any) => new mongoose.Types.ObjectId(provider[0])
          ),
        },
        is_active: true,
      },
      { provider: 1, available_bit: 1 } // Select only necessary fields
    ).lean();

    let returnProviders: {
      providerId: string;
      availableDurations: number[];
    }[] = [];

    if (!providerAvailabilities.length) {
      console.log("No providers available for booking");
    } else {
      for (let i = 0; i < providerAvailabilities.length; i++) {
        let availableDurations: number[] = [];

        // Check each duration in the duration array
        for (let d of duration) {
          if (
            checkConsecutive(
              providerAvailabilities[i].available_bit,
              timeIndex,
              d
            )
          ) {
            availableDurations.push(d * 15); // Convert slots to minutes
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

    res.json({ success: true, returnProviders });
    return;
  } catch (error) {
    console.error("Error fetching providers:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};


export const formatTime = (date: Date): string => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  console.log(hours,minutes);
  if (minutes <=30){
    minutes = 0;
  } else {
    minutes = 30;
  }

  return `${hours}:${minutes === 0 ? "00" : "30"}`;
};
