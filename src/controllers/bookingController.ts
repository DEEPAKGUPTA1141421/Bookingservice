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
import User from "../models/UserSchema";
import { BookedSlot } from "../models/BookedSlotSchema";
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
    console.log("isScheduled", isScheduled);
    if (isScheduled) {
      console.log("yes Scheduled", isScheduled)
      start_time = new Date(start_time);
      start_time.setMinutes(start_time.getMinutes() + 330);
      console.log("yes Scheduled", start_time);
    }
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
  next: NextFunction
): Promise<void> => {
  try {
    let { BookingId } = req.body;
    if (!BookingId) {
      next(new ErrorHandler("BookingId Is Empty", 201));
      return;
    }
    BookingId = convertStringToObjectId(BookingId);
    console.log(BookingId, "vvvvvv");
    const bookingdetails = await Booking.find({ _id: BookingId })
      .populate("user")
      .populate({
      path: "bookingSlot_id",
      populate: [{ path: "serviceoption" }],
    });
    console.log(bookingdetails);
    sendResponse(res, 201, "Booking Details", bookingdetails);
  } catch (error) {
    console.log("errr",error)
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
    const requestData: any = transformBookingRequest(validation.data);

    // Update booking in the database
    const updatedBooking = await updateBookingService(requestData);

    res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
      success: true,
    });
  } catch (error: any) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getLiveOrdersOfProvider = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const providerId = req.user?._id
    const todayDate = new Date();
    todayDate.setMinutes(todayDate.getMinutes() + 330);
    console.log("Searching for bookings on:", todayDate, providerId);

    const nextBooking = await BookedSlot.findOne({
      providers: { $in: providerId },
      start_time: { $gte: todayDate },
    })
      .sort({ start_time: 1 })
      .lean();
    console.log("Searching for bookings on:", nextBooking);
    const bookingdetails = await Booking.find({
      bookingSlot_id: nextBooking?._id,
    }).populate({
      path: "bookingSlot_id",
      populate: [{ path: "serviceoption" }],
    });
    console.log("Searching for bookings on:", bookingdetails);
    res.status(200).json({
      success: true,
      message: "live orders",
      nextBooking: bookingdetails,
    });
  } catch (error) {
    const err =
      error instanceof ErrorHandler
        ? error
        : new ErrorHandler("Error fetching bookings", 500);
    res.status(err.statusCode).json({ message: err.message });
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
    const { bookingId } = req.body;

    if (!bookingId) {
      res.status(400).json({ message: "Booking ID is required" });
      return;
    }
    const result = await acceptBookingService(bookingId);
    sendResponse(res, 201, "Accepted SuccessFully", result);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 501));
  }
};

export const applyPoints = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction(); // Start a transaction

  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      res.status(400).json({ message: "Booking ID is required" });
      return;
    }

    const userId = req.user?._id;
    // Fetch user and booking details inside the transaction
    const user = await User.findOne({ _id: userId }).session(session);
    const booking = await Booking.findOne({ _id: bookingId }).session(session);

    if (!user || !booking) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({ message: "User or Booking not found" });
      return;
    }

    if (booking.pointsUsed != 0) {
      await session.abortTransaction();
      session.endSession();
      res
        .status(200)
        .json({ message: "Points Already Appllied On This Boooking" });
      return;
    }
    if (booking.actualPrice < 30000) {
      // Ensure booking price is above ₹300 (30000 paise)
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({
        message: "Booking price must be at least ₹300 to use points",
      });
      return;
    }

    // **Deduct points: 10,000 paise (₹100) per order, but user can use up to 100 paise (₹1)**
    const pointsToUse = Math.min(user.points, 10000); // Max usage cap of 100 points (₹1)

    if (pointsToUse < 10000) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ message: "Insufficient points to apply" });
      return;
    }

    // Update user points atomically using `$inc`
    const updatedUser = await User.updateOne(
      { _id: userId, points: { $gte: pointsToUse } }, // Ensure user has enough points
      { $inc: { points: -pointsToUse } }, // Deduct points atomically
      { session }
    );

    if (updatedUser.modifiedCount === 0) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ message: "Not enough points to apply" });
      return;
    }

    // Update booking with applied points
    booking.pointsUsed = pointsToUse;
    booking.finalPrice = booking.finalPrice - pointsToUse;
    await booking.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    sendResponse(res, 200, "Points applied successfully", {
      pointsUsed: pointsToUse,
      remainingPoints: user.points - pointsToUse, // Updated value after transaction
      finalPrice: booking.finalPrice,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    next(new ErrorHandler(error.message, 500));
  }
};

export const removeAppliedPoints = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction(); // Start a transaction

  try {
    const { bookingId } = req.body;
    console.log("hello from this side");

    if (!bookingId) {
      res.status(400).json({ message: "Booking ID is required" });
      return;
    }

    const userId = req.user?._id;
    console.log("hello from this side");
    // Fetch user and booking details inside the transaction
    const user = await User.findOne({ _id: userId }).session(session);
    const booking = await Booking.findOne({ _id: bookingId }).session(session);

    if (!user || !booking) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({ message: "User or Booking not found" });
      return;
    }

    // Check if points were applied before
    console.log("hello from this side");
    if (booking.pointsUsed === 0) {
      console.log("hello from this side", booking.pointsUsed);
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ message: "No points applied to this booking" });
      return;
    }
    console.log("hello from this side");
    const pointsToRefund = booking.pointsUsed;
    console.log("hello from this side", pointsToRefund);

    // Refund points to the user
    const updatedUser = await User.updateOne(
      { _id: userId },
      { $inc: { points: pointsToRefund } }, // Refund points
      { session }
    );

    if (updatedUser.modifiedCount === 0) {
      await session.abortTransaction();
      session.endSession();
      res.status(500).json({ message: "Failed to refund points" });
      return;
    }

    // Reset booking's pointsUsed and recalculate final price
    booking.finalPrice += pointsToRefund;
    booking.pointsUsed = 0;
    await booking.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    sendResponse(res, 200, "Points removed successfully", {
      refundedPoints: pointsToRefund,
      newFinalPrice: booking.finalPrice,
      userPoints: user.points + pointsToRefund, // Updated balance
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    next(new ErrorHandler(error.message, 500));
  }
};


