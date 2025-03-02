import { Booking } from "../models/BookingSchema";
import { Cart } from "../models/CartSchema";
import { Payment } from "../models/PaymentSchema";
import ErrorHandler from "../config/GlobalerrorHandler";
import { BookedSlot } from "../models/BookedSlotSchema";
import mongoose from "mongoose";
import { connectedProviders } from "..";
import { Type } from "aws-sdk/clients/cloudformation";
import { convertStringToObjectId, convertToHHMM } from "../utils/helper";
import { ServiceProviderAvailability } from "../models/ServiceProviderAvailabilitySchema";
import { getIndex } from "./slotService";


// Define allowed booking statuses
type BookingStatus =
  | "initiated"
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "delivered";

export const createBookingService = async (userId: string, address: string) => {
  const cart = await Cart.findOne({ user: userId }).populate(
    "items.service items.service_option"
  );

  if (!cart || cart.items.length === 0) {
    throw new ErrorHandler("Cart is empty", 400);
  }

  const booking = new Booking({
    user: userId,
    cart: cart._id,
    status: "initiated",
    bookingDate: new Date(),
    address,
  });

  await booking.save();
  return booking;
};

export const updateBookingService = async (
  bookingId: string,
  status?: BookingStatus, // Enforce correct type
  scheduledTime?: string,
  completedTime?: string
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ErrorHandler("Booking not found", 404);
  }

  if (status) booking.status = status;
  if (scheduledTime) booking.scheduledTime = new Date(scheduledTime); // ✅ Convert string to Date
  if (completedTime) booking.completedTime = new Date(completedTime); // ✅ Convert string to Date

  await booking.save();
  return booking;
};

export const getBookingsService = async (userId: string) => {
  const bookings = await Booking.find({ user: userId }).populate("cart");

  if (!bookings || bookings.length === 0) {
    throw new ErrorHandler("No bookings found", 404);
  }

  return bookings;
};

export const deleteBookingService = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ErrorHandler("Booking not found", 404);
  }

  if ((booking.status as BookingStatus) !== "confirmed") {  // ✅ Explicit type assertion
    throw new ErrorHandler("Only confirmed bookings can be canceled", 400);
  }

  if ((booking.status as BookingStatus) === "delivered") { // ✅ Explicit type assertion
    throw new ErrorHandler("Cannot cancel a delivered booking", 400);
  }

  const payment = await Payment.findOne({ booking: bookingId });

  if (!payment) {
    await Booking.findByIdAndDelete(bookingId);
    return {
      message: "Booking canceled successfully (COD). Provider notified.",
    };
  } else {
    if (payment.status === "SUCCESS") {
      // Call refund API logic here if needed
    }

    await Payment.findByIdAndDelete(payment._id);
    await Booking.findByIdAndDelete(bookingId);

    return {
      message: "Booking canceled successfully. Refund processed if applicable.",
    };
  }
};

export const acceptBookingService = async (
  bookingId: string,
  providerId: string
) => {
  if (
    !mongoose.Types.ObjectId.isValid(bookingId) ||
    !mongoose.Types.ObjectId.isValid(providerId)
  ) {
    throw new ErrorHandler("Invalid booking or provider ID", 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction(); // Begin transaction

  try {
    // ✅ Fetch booking with LOCK for updates
    const booking = await Booking.findOne({
      _id: bookingId,
      status: { $eq: "initiated" }, // Status should not be "confirmed"
    }).session(session);
    if (!booking) throw new ErrorHandler("Booking not found", 404);

    const bookedSlot = await BookedSlot.findOne({
      _id: booking.bookingSlot_id,
      status: { $eq: "initiated" },
      providers: { $in: [convertStringToObjectId(providerId)] }, // Check if providerId exists in providers array
    }).session(session);
    if (!bookedSlot) throw new ErrorHandler("Booked slot not found", 404);

    let userId = booking.user;
    const previousProviders = bookedSlot.providers;

    // ✅ Remove other providers & keep only the accepting provider
    bookedSlot.providers = [convertStringToObjectId(providerId)];
    bookedSlot.status = "confirmed";
    await bookedSlot.save({ session });

    // ✅ Update booking status to confirmed
    booking.status = "confirmed";
    await booking.save({ session });

    // ✅ Update ServiceProviderAvailability (set available_bit to 0)
    let index:string|number = convertToHHMM(bookedSlot.start_time.toDateString());
    index=getIndex(index)
    const response = await ChangeBitOfProvider(providerId,index,(bookedSlot.slotTiming/30));
    if (!response) {
       await session.abortTransaction(); // Rollback on error
       session.endSession();
       throw new ErrorHandler("Internal Server Error", 500);
    }

    // ✅ Commit transaction (if everything is successful)
    await session.commitTransaction();
    session.endSession();

    // 🔔 Notify the User
    const ws1 = connectedProviders.get(userId.toString());
    if (ws1 && ws1.readyState === 1) {
      ws1.send(
        JSON.stringify({
          type: "BOOKING_CONFIRMED",
          message: "Your booking has been confirmed!",
          bookingId,
        })
      );
    }

    // 🔔 Notify other providers that booking is taken
    previousProviders.forEach((otherProviderId: any) => {
      if (otherProviderId !== providerId) {
        const ws = connectedProviders.get(otherProviderId.toString());
        if (ws && ws.readyState === 1) {
          ws.send(
            JSON.stringify({
              type: "BOOKING_UNAVAILABLE",
              message: "This booking has already been accepted.",
              bookingId,
            })
          );
        }
      }
    });

    return { success: true, message: "Booking confirmed", providerId };
  } catch (error:any) {
    await session.abortTransaction(); // Rollback on error
    session.endSession();
    throw new ErrorHandler(error.message || "Internal Server Error", 500);
  }
};

const ChangeBitOfProvider = async (
  providerId: string,
  timeIndex: number,
  numberOfSlots: number
) => {
  return true;
  // const dateOnly = new Date();
  // dateOnly.setUTCHours(0, 0, 0, 0);
  // const existingAvailability = await ServiceProviderAvailability.findOne(
  //   {
  //     provider: convertStringToObjectId(providerId),
  //     date: dateOnly,
  //   },
  //   { available_bit: 1 } // Projection to fetch only `available_bit`
  // );

  // if (!existingAvailability) return false; // If no record exists
  // let availableBit = existingAvailability.available_bit;

  // // Check if all slots are available
  // for (let i = timeIndex; i < timeIndex + numberOfSlots; i++) {
  //   if (((availableBit >> i) & 1) === 0) {
  //     return false; // Slot already booked
  //   }
  //   availableBit &= ~(1 << i); // Set bit to 0 (mark as booked)
  // }

  // // Update the document in DB
  // const updatedDoc = await ServiceProviderAvailability.updateOne(
  //   {
  //     provider: convertStringToObjectId(providerId),
  //     date: dateOnly,
  //   },
  //   { available_bit: availableBit }
  // );

  // return updatedDoc.modifiedCount > 0; // Return true if update was successful
};


