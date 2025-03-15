import { NextFunction, Request, Response } from "express";
import {
  createBookingService,
  updateBookingService,
  getBookingsService,
  deleteBookingService,
  acceptBookingService,
  UpdateBookingParams,
} from "../services/bookingService";
import {
  acceptBookingSchema,
  createBookingSchema,
  updateBookingSchema,
} from "../validations/booking_validation";
import ErrorHandler from "../config/GlobalerrorHandler";
import mongoose from "mongoose";
import { Booking } from "../models/BookingSchema";
import { sendResponse } from "../utils/responseHandler";
import { CheckZodValidation, convertStringToObjectId } from "../utils/helper";
import { IRequest } from "../middleware/authorised";
import { Payment } from "../models/PaymentSchema";
import { bookSlot } from "./slotController";
function transformBookingRequest(body: any) {
  const { modeOfPayment, pointsUsed, bookingId, address, status, finalPrice } =
    body;

  // Extract relevant address parts (You can improve this with a geocoding API if needed)
  const addressParts = address.current_address.split(", ");

  const transformedAddress = {
    street: addressParts[0] || "",
    city: addressParts[addressParts.length - 3] || "",
    state: addressParts[addressParts.length - 2] || "",
    country: addressParts[addressParts.length - 1] || "",
    location: {
      type: "Point",
      coordinates: address.location?.coordinates || [],
    },
  };

  return {
    modeOfPayment,
    pointsUsed,
    bookingId,
    address: transformedAddress,
    status,
    finalPrice,
  };
}

export const createBooking = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("reached here");
    const userId = req.user?._id;
    console.log("body check up", req.body);
    const validation = createBookingSchema.safeParse(req.body);
    if (!validation.success) {
      console.log("reached here1", validation.error.message);
      sendResponse(res, 404, "Validation Failed", {});
      return;
    }
    let {
      date,
      duration,
      serviceoption,
      start_time,
      providersList,
      actualService,
      isScheduled,
    } = req.body;
    const booking = await createBookingService({
      userId,
      date,
      duration,
      serviceoption,
      start_time,
      providersList,
      actualService,
    });
    if (booking.success) {
      sendResponse(res, 201, "Booking Initiated SuccesFully", booking);
      return;
    } else {
      next(new ErrorHandler("Failed To Create Order", 501));
    }
  } catch (error) {
    const err =
      error instanceof ErrorHandler
        ? error
        : new ErrorHandler("Internal server error", 500);
    res.status(err.statusCode).json({ message: err.message });
  }
};

export const getConfirmBooking = async (
  req: Request,
  res: Response,
  next:NextFunction
): Promise<void> => {
  try {
    let { BookingId } = req.body;
    if (!BookingId) {
      next(new ErrorHandler("TranscationId Is Empty", 201));
      return;
    }
    BookingId = convertStringToObjectId(BookingId);
    console.log(BookingId, "vvvvvv");
    const bookingdetails = await Booking.find({_id:BookingId}).populate({
      path: "bookingSlot_id"
    });
    console.log(bookingdetails)
    sendResponse(res, 201, "Booking Details", bookingdetails);
  }
  catch (error) {
    next(new ErrorHandler("Failed To Fetch Booking Details", 501));
  }
};

export const getBookingDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      res.status(400).json({ message: "Booking ID is required" });
      return;
    }

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "bookingSlot_id",
        populate: {
          path: "providers",
        },
      })
      .lean(); // Using lean() for performance boost

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }
    res.status(200).json({ success: true, data: booking });
    return;
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Body checkup:", req.body);

    // Validate request body
    const validation = updateBookingSchema.safeParse(req.body);
    if (!validation.success) {
      console.log("validation failed");
      res.status(400).json({ message: validation.error.errors });
      return;
    }

    // Transform request for DB insertion
    const requestData:any = transformBookingRequest(
      validation.data
    );

    // Update booking in the database
    const updatedBooking = await updateBookingService(requestData);

    res
      .status(200)
      .json({
        message: "Booking updated successfully",
        booking: updatedBooking,
        success:true
      });
  } catch (error: any) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getBookings = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId: any = req.user?._id;
    const bookings = await getBookingsService(userId);

    res.status(200).json({ bookings });
  } catch (error) {
    const err =
      error instanceof ErrorHandler
        ? error
        : new ErrorHandler("Error fetching bookings", 500);
    res.status(err.statusCode).json({ message: err.message });
  }
};

export const deleteBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const response = await deleteBookingService(bookingId);

    res.status(200).json(response);
  } catch (error) {
    const err =
      error instanceof ErrorHandler
        ? error
        : new ErrorHandler("Error canceling booking", 500);
    res.status(err.statusCode).json({ message: err.message });
  }
};

export const acceptBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = CheckZodValidation(
      req.body,
      acceptBookingSchema,
      next
    );
    if (!validatedData.success) {
      next(new ErrorHandler("Validation failed", 500));
      return;
    }
    const { bookingId, providerId } = validatedData.data;
    const result = await acceptBookingService(bookingId, providerId);
    sendResponse(res, 201, "Accepted SuccessFully", result);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 501));
  }
};


