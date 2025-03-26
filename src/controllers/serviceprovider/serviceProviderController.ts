import { Request, Response, NextFunction, response } from "express";
import {
  createServiceProviderService,
  getAllServiceProvidersService,
  getServiceProviderByIdService,
  updateServiceProviderService,
  deleteServiceProviderService,
  getLocationFromProviderService,
  UpdateAvailabilityService,
  createAvailabilityservice,
  reachedAtUserLocationService,
  getNearbyServiceProviders,
} from "../../services/serviceprovider/serviceproviderservice";
import { sendResponse } from "../../utils/responseHandler";
import {
  CheckZodValidation,
  convertStringToObjectId,
  getAvailableProvidersFromRedis,
} from "../../utils/helper";
import ErrorHandler from "../../config/GlobalerrorHandler";
import {
  createAvailabilitySchema,
  createServiceProviderSchema,
  otpVerificationatUserLocationSchema,
  UpdateAvailabilitySchema,
  updateServiceProviderSchema,
} from "../../validations/service_provider_validation";
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
import { IServiceOption, ServiceOption } from "../../models/ActualServiceSchema";
import { IRequest } from "../../middleware/authorised";
import ServiceProvider from "../../models/ServiceProviderSchema ";
import { createRedisClient } from "../../config/redisCache";
// Create a new service provider
export const createServiceProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log(req.file);
    const profilePicture = req.file as Express.MulterS3.File | undefined;
    if (!profilePicture || !profilePicture.location) {
      next(new ErrorHandler("At least one image is required", 400));
      return;
    }
    console.log(req.body);
    const validation = CheckZodValidation(
      { ...req.body, image: profilePicture.location },
      createServiceProviderSchema,
      next
    );
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
export const getAllServiceProviders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await getAllServiceProvidersService(next);
    sendResponse(
      res,
      200,
      "Service Providers retrieved successfully",
      response
    );
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get a single service provider by ID
export const getServiceProviderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await getServiceProviderByIdService(req.params.id, next);
    sendResponse(res, 200, "Service Provider retrieved successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Update a service provider
export const updateServiceProvider = async (
  req: IRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("update provider hit", req.body);
    const profilePicture = req.file as Express.MulterS3.File | undefined;
    console.log("profile", profilePicture);
    if (profilePicture != undefined && !profilePicture.location) {
      console.log("hit this one");
      next(new ErrorHandler("At least one image is required", 400));
      return;
    }
    const validation = CheckZodValidation(
      { ...req.body },
      updateServiceProviderSchema,
      next
    );
    console.log("validation", validation);
    if (!validation.success) {
      next(new ErrorHandler("validation failed", 400));
      return;
    }
    const providerId = req.user?._id;
    console.log("providerId", providerId);
    const response = await updateServiceProviderService(
      providerId,
      validation.data,
      next
    );
    sendResponse(res, 200, "Service Provider Updated Successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const getAllLiveAndPastBookings = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    const user = req.user?._id;
    console.log("status", status);

    if (!status || !user) {
      return next(new ErrorHandler("Status is required", 400));
    }
    console.log("status", status);
    const bookings = await Booking.find({ status })
      .select("_id finalPrice") // Selecting only _id from Booking
      .populate({
        path: "bookingSlot_id",
        match: { providers: { $in: convertStringToObjectId(user) } },
        populate: {
          path: "serviceoption",
        },
      })
      .populate({
        path: "user", // Assuming you want to populate user details from the Booking model
      })
      .sort({ "bookingSlot_id.date": -1 }) // Sorting by bookingSlot_id date in descending order
      .limit(50);

    if (!bookings || bookings.length === 0) {
      sendResponse(res, 200, "No bookings found", []);
      return;
    }
    sendResponse(res, 200, "Get All Bookings", { bookings });
    return;
  } catch (error: any) {
    return next(
      new ErrorHandler(error.message || "Internal Server Error", 500)
    );
  }
};

// Delete a service provider
export const deleteServiceProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await deleteServiceProviderService(req.params.id, next);
    sendResponse(res, 200, "Service Provider Deleted Successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const getServiceProviderLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    const location = await getLocationFromProviderService(id);
    if (!location) {
      sendResponse(
        res,
        200,
        "Service Provider Location retrieved successfully",
        location
      );
      return;
    }
    next(new ErrorHandler("Service Provider Location not found", 404));
  } catch (error: any) {
    next(new ErrorHandler(error.message, 404));
  }
};

export const createAvailability = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("availiblity hit now");
    const validatedData = CheckZodValidation(
      req.body,
      createAvailabilitySchema,
      next
    );
    const providerId = req.user?._id;
    console.log("providerId", providerId);
    if (!validatedData.success) {
      next(new ErrorHandler("Validation failed", 500));
      return;
    }
    console.log("date check", { ...validatedData.data });
    const response: create_status_return = await createAvailabilityservice({
      ...validatedData.data,
      providerId,
    });
    console.log("finallly response", response);
    if (
      response &&
      response.status != "created" &&
      response.status != "exists"
    ) {
      next(new ErrorHandler("Availability could not be created", 501));
      return;
    } else {
      sendResponse(res, 201, "Availability created successfully", response);
    }
  } catch (error: any) {
    next(new ErrorHandler(error.message, 501));
  }
};

export const updateAvailability = async (
  req: IRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = CheckZodValidation(
      req.body,
      UpdateAvailabilitySchema,
      next
    );
    if (!validatedData.success) {
      next(new ErrorHandler("Validation failed", 500));
      return;
    }
    console.log("in controller", validatedData.data);
    const providerId = req.user?._id;
    console.log("providerId", providerId);
    const response: create_status_return = await UpdateAvailabilityService({
      ...validatedData.data,
      providerId,
    });
    if (response.status == "exists") {
      sendResponse(res, 302, "Availability already exists", response);
      return;
    } else {
      sendResponse(res, 201, "Availability updated successfully", response);
    }
  } catch (error: any) {
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
    const response: create_status_return = await reachedAtUserLocationService(
      validatedData.data
    );
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
    const { otp, userId, bookingId } = req.body;

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
    booking.status = "verified";
    await booking?.save();
    sendResponse(res, 200, "OTP verified successfully", {});
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
    let { latitude, longitude, radius, serviceId, date } = req.body;

    if (!serviceId || !latitude || !longitude || !radius || !date) {
      res.status(400).json({ error: "Missing required parameters" });
      return;
    }

    // Normalize date to UTC midnight to match stored dates
    const givenDate = new Date(date);
    givenDate.setUTCHours(0, 0, 0, 0); // Ensuring we compare only the date part

    console.log("Given Date (UTC):", givenDate, serviceId, radius);

    // Get nearby service providers
    const serviceProviders = await ServiceProvider.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(latitude), parseFloat(longitude)],
          }, // Correct order: [longitude, latitude]
          distanceField: "distance",
          query: {
            actualService: {
              $in: [convertStringToObjectId(serviceId)],
            },
          },
          maxDistance: radius, // Convert km to meters
          includeLocs: "dist.location",
          spherical: true,
        },
      },
    ]);

    console.log("Service Providers:", serviceProviders);

    const providerIds = serviceProviders.map((provider) => provider._id);

    if (providerIds.length === 0) {
      res.status(200).json({
        success: true,
        message: "No providers found in the given radius",
        data: [],
      });
      return;
    }

    // Fetch provider availability for the specific date
    const providerAvailabilities = await ServiceProviderAvailability.find(
      { provider: { $in: providerIds }, date: givenDate },
      { provider: 1, available_bit: 1 }
    ).lean();

    console.log("Provider Availabilities:", providerAvailabilities);

    const serviceOptions = await ServiceOption.find({
      actualService: convertStringToObjectId(serviceId),
    }).lean();

    if (!providerAvailabilities.length) {
      res.status(200).json({
        success: true,
        message: "No available providers for the selected date",
        data: serviceOptions,
      });
      return;
    }

    // Get the current time in UTC and calculate index
    const now = new Date();
    const currentTime = formatTime(now);
    const timeIndex = getIndex(currentTime);

    // Map service options to provider IDs
    let serviceOptionsMap: Record<
      string,
      IServiceOption & { providerIds: string[] }
    > = {};

    for (let serviceOption of serviceOptions) {
      serviceOptionsMap[serviceOption._id.toString()] = {
        ...serviceOption,
        providerIds: [],
      } as IServiceOption & { providerIds: string[] };
    }


    for (let provider of providerAvailabilities) {
      for (let serviceOption of serviceOptions) {
        let requiredSlots = serviceOption.duration / 15;

        if (
          checkConsecutive(provider.available_bit, timeIndex, requiredSlots)
        ) {
          console.log("Slot available for provider:", provider.provider);
          serviceOptionsMap[serviceOption._id.toString()].providerIds.push(
            provider.provider.toString()
          );
        }
      }
    }

    // Convert map to array
    const formattedResponse = Object.values(serviceOptionsMap);

    res.status(200).json({
      success: true,
      message: "Successfully fetched service options",
      data: formattedResponse,
    });
  } catch (error) {
    console.error("Error fetching providers:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

const checkAvailableTimingSlots = async (
  latitude: number,
  longitude: number,
  radius: number,
  serviceId: any,
  date: Date
): Promise<any> => {
  try {
    let today = new Date();
    let istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    let todayIST = new Date(today.getTime() + istOffset);
    today = todayIST;
    const givenDate = new Date(date);
    console.log("1", givenDate.getDate(), today.getDate(), givenDate == today);
    console.log("2", typeof serviceId, serviceId);
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
    console.log("serviceProviders",serviceProviders);
    const providerIds = serviceProviders.map(
      (provider) => new mongoose.Types.ObjectId(provider._id)
    );
    let givendateformongodbutc = new Date(givenDate);
    givendateformongodbutc.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC
    const providerAvailabilities = await ServiceProviderAvailability.find(
      {
        is_active: true,
        date: givendateformongodbutc,
        provider: { $in: providerIds }, // ✅ Pass providerIds directly as an array
      },
      { provider: 1, available_bit: 1 } // Select only necessary fields
    ).lean();
    return providerAvailabilities;
  } catch (error) {
    console.error("Error fetching providers:", error);
  }
};
const generateTimeSlots = async (
  selectedDate: Date,
  duration: number,
  serviceId: string,
  latitude: number,
  longitude: number,
  radius: number
) => {
  const now = new Date(selectedDate);
  const currentTime = new Date();
  // Set start time to 8:00 AM
  // If the selected date is today, adjust the start time
  let startTime;
  if (
    now.getDate() === currentTime.getDate() &&
    now.getMonth() === currentTime.getMonth() &&
    now.getFullYear() === currentTime.getFullYear()
  ) {
    console.log("Today Date");
    let minutes = currentTime.getMinutes();
    let nextSlotMinutes = Math.ceil(minutes / 15) * 15; // Round up to next 15-minute slot

    // Set start time to the next available slot
    startTime = new Date(now);
    startTime.setHours(currentTime.getHours(), nextSlotMinutes, 0, 0);
    // Ensure start time is within the allowed range (8:00 AM - 8:00 PM)
    if (startTime < new Date(now.setHours(8, 0, 0, 0))) {
      console.log("leser than 8:Am");
      startTime.setHours(8, 0, 0, 0);
    } else if (startTime > new Date(now.setHours(20, 0, 0, 0))) {
      return [];
    }

    console.log("Adjusted Start Time:", startTime);
  } else {
    // If the selected date is not today, start at 8:00 AM
    startTime = new Date(now);
    startTime.setHours(8, 0, 0, 0);
    console.log("Start Time for Future Date:", startTime);
  }
  // Set end time to 8:00 PM
  const endTime = new Date(now);
  endTime.setHours(20, 0, 0, 0);

  const timeSlots = [];

  while (startTime < endTime) {
    const formattedIterDate = new Date(startTime); // Create a new Date instance

    const formattedTime = formattedIterDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // Use 12-hour format
    });
    timeSlots.push({
      time: formattedTime,
      formattedIterDate,
      providers: new Array(),
    });

    // Increment start time by 15 minutes
    startTime.setMinutes(startTime.getMinutes() + 15);
    const checklimit = new Date(startTime);
    checklimit.setMinutes(checklimit.getMinutes() + duration);
    if (checklimit > endTime) {
      break;
    }
  }
  const availableprovider = await checkAvailableTimingSlots(
    latitude,
    longitude,
    radius,
    serviceId,
    selectedDate
  );
  console.log("available provider", availableprovider);
  if (availableprovider.length == 0) return timeSlots;
  for (let i = 0; i < timeSlots.length; i++) {
    for (let j = 0; j < availableprovider.length; j++) {
      let timeIndex = getIndex(timeSlots[i].time);
      console.log("index", timeSlots[i].time, timeIndex);
      if (
        checkConsecutive(
          availableprovider[j].available_bit,
          timeIndex,
          duration / 15
        )
      ) {
        timeSlots[i].providers.push(availableprovider[j].provider);
      }
    }
  }
  return timeSlots;
};
export const getTimingSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("slots are ready and need to test", req.body);
    const { selectedDate, duration, latitude, longitude, radius, serviceId } =
      req.body;
    const date = new Date(selectedDate); // Indian Standa//rd Time (IST)
    const slots = await generateTimeSlots(
      date,
      duration,
      serviceId,
      latitude,
      longitude,
      radius
    );
    res.status(200).json({ slots });
  } catch (error: any) {
    res.status(501).json({ slots: [] });
  }
};

export const genericOptions = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId).lean();
    const latitude = user?.address?.location?.coordinates[0];
    const longitude = user?.address?.location?.coordinates[1];
    const serviceId = "67e024592603aec7e6e7c154";

    if (!latitude || !longitude) {
      res.status(400).json({ message: "Location Invalid", success: false });
      return;
    }

    const dateOnly = new Date();
    dateOnly.setUTCHours(0, 0, 0, 0); // Normalize date to midnight UTC

    // Get nearby service providers
    const serviceProviders = await ServiceProvider.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [latitude, longitude] }, // Correct order
          distanceField: "distance",
          query: {
            actualService: {
              $in: [convertStringToObjectId(serviceId)],
            },
          },
          maxDistance: 3000, // 3km radius
          includeLocs: "dist.location",
          spherical: true,
        },
      },
    ]);
    console.log("serviceProviders", serviceProviders);
    const providerIds = serviceProviders.map((provider) => provider._id);

    // Fetch provider availability
    const providerAvailabilities = await ServiceProviderAvailability.find(
      { provider: { $in: providerIds }, date: dateOnly },
      { provider: 1, available_bit: 1 }
    ).lean();

    const serviceOptions = await ServiceOption.find({
      actualService: convertStringToObjectId(serviceId),
    }).lean();

    if (!providerAvailabilities.length) {
      res.status(200).json({
        success: true,
        message: "No available providers",
        data: serviceOptions,
      });
      return;
    }

    console.log("providerAvailabilities", providerAvailabilities);

    // Get available service options

    const now = new Date();
    const currentTime = formatTime(now);
    const timeIndex = getIndex(currentTime);

    // Organize data: Map service options to provider IDs where checkConsecutive() is true
    let serviceOptionsMap: Record<
      string,
      IServiceOption & { providerIds: string[] }
    > = {};

    for (let serviceOption of serviceOptions) {
      serviceOptionsMap[serviceOption._id.toString()] = {
        ...serviceOption,
        providerIds: [],
      } as IServiceOption & { providerIds: string[] };
    }




    for (let provider of providerAvailabilities) {
      for (let serviceOption of serviceOptions) {
        let requiredSlots = serviceOption.duration / 15;

        if (
          checkConsecutive(provider.available_bit, timeIndex, requiredSlots)
        ) {
          console.log("true");
          serviceOptionsMap[serviceOption._id.toString()].providerIds.push(
            provider.provider.toString()
          );
        }
      }
    }

    // Convert map to array
    const formattedResponse = Object.values(serviceOptionsMap);

    res.status(200).json({
      success: true,
      message: "Successfully fetched service options",
      data: formattedResponse,
    });
  } catch (error) {
    console.error("Error in genericOptions:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
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
