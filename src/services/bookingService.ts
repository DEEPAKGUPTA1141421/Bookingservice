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
import { Types } from "mongoose";
import { ServiceOption } from "../models/ActualServiceSchema";
import { updateActualService } from "./admin/actualServiceService";
import { boolean } from "zod";

interface BookingData {
  userId: Types.ObjectId | any;
  date: string; // YYYY-MM-DD format
  duration: number;
  serviceoption: string;
  start_time: string; // HH:MM format
  providersList: string[]; // Array of provider IDs
  actualService: string;
}

// Define allowed booking statuses
type BookingStatus = "confirmed" | "cancelled" | "delivered";

export interface UpdateBookingParams {
  bookingId: string;
  status?: BookingStatus;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    location: {
      type: "Point";
      coordinates: [number, number];
    };
  };
  finalPrice: string;
  pointsUsed?: string;
  modeOfPayment?: "cash" | "net-banking";
}
export const createBookingService = async ({
  userId,
  date,
  duration,
  serviceoption,
  start_time,
  providersList,
  actualService,
}: BookingData) => {
  try {
    console.log("service layer", userId);
    let changeprovidersList = providersList.map((elem) =>
      convertStringToObjectId(elem)
    );
    const serviceoprtiondoc = await ServiceOption.findById(
      convertStringToObjectId(serviceoption),
      { price: 1, discount_price: 1, discount_type: 1, upto: 1 }
    ).lean();

    console.log("service layer", serviceoprtiondoc);
    const bookslot = await BookedSlot.create({
      providers: changeprovidersList,
      Acutalservice: actualService,
      serviceoption: convertStringToObjectId(serviceoption),
      date: date,
      start_time: start_time,
      slotTiming: duration,
    });
    console.log("create slot", bookslot);
    if (bookslot && serviceoprtiondoc && serviceoprtiondoc.discount_price) {
      const price = parseInt(serviceoprtiondoc.price, 10); // Total price in paisa
      const discountPrice = parseInt(
        serviceoprtiondoc.discount_price || "0",
        10
      ); // Discount price in paisa
      const upto = parseInt(serviceoprtiondoc.upto || "0", 10); // Max discount limit in paisa
      // Ensure discount doesn't exceed price
      let discount = 0;
      if (serviceoprtiondoc.discount_type === "percent" && discountPrice > 0) {
        // Calculate percentage discount
        discount = Math.floor((discountPrice * upto) / 100);

        // Apply max limit (upto)
        if (upto > 0) {
          discount = Math.min(discount, upto);
        }
      } else if (serviceoprtiondoc.discount_type === "flat") {
        // Flat discount (directly in paisa)
        discount = discountPrice;
      }
      let taxes = Math.floor((discount * 18) / 100);
      //Final amount after discount
      const finalPrice = price - discount + taxes;
      console.log({ price, discount, finalPrice });
      const booking = await Booking.create({
        user: userId,
        bookingSlot_id: bookslot.id,
        discount: discount,
        actualPrice: price,
        taxes: taxes,
        finalPrice: finalPrice,
      });
      if (booking) {
        return {
          success: true,
          userId: userId,
          BookingId: booking.id,
          date: date,
          start_time: start_time,
          duration: duration,
          discount: discount,
          actualPrice: price,
          taxes: taxes,
          finalPrice: finalPrice,
        };
      } else {
        return { success: false };
      }
    } else {
      throw new ErrorHandler("Failed To Create Bookings", 501);
    }
  } catch (error: any) {
    console.log(error.message);
    throw new ErrorHandler("Internal Server Error", 501);
  }
};

export const updateBookingService = async (response: UpdateBookingParams) => {
  const { bookingId, status, address, pointsUsed, modeOfPayment, finalPrice } =
    response;

  // Find the booking by ID
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ErrorHandler("Booking not found", 404);
  }

  // Update fields if provided
  if (status) booking.status = status;
  if (address) booking.address = address;
  if (pointsUsed) booking.pointsUsed = pointsUsed;
  if (modeOfPayment) booking.modeOfPayment = modeOfPayment;
  if (finalPrice)
    booking.finalPrice = (
      parseFloat(finalPrice) - parseFloat(pointsUsed || "0")
    ).toString();
  // Save updated booking
  await booking.save();
  return booking;
};

export const getBookingsService = async (
  userId: any,
  page = 1,
  limit = 100
) => {
  try {
    const offset = (page - 1) * limit; // Calculate offset

    const bookings = await Booking.find({ user: userId })
      .sort({ updated_at: -1 }) // Sort by created_at DESC
      .limit(limit) // Limit results to 30
      .skip(offset); // Apply offset for pagination

    return bookings;
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    throw new ErrorHandler(error.message, 501);
  }
};

export const deleteBookingService = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ErrorHandler("Booking not found", 404);
  }

  if ((booking.status as BookingStatus) !== "confirmed") {
    // ✅ Explicit type assertion
    throw new ErrorHandler("Only confirmed bookings can be canceled", 400);
  }

  if ((booking.status as BookingStatus) === "delivered") {
    // ✅ Explicit type assertion
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
    await bookedSlot.save({ session });

    // ✅ Update booking status to confirmed
    booking.status = "confirmed";
    await booking.save({ session });

    // ✅ Update ServiceProviderAvailability (set available_bit to 0)
    let index: string | number = convertToHHMM(
      bookedSlot.start_time.toDateString()
    );
    index = getIndex(index);
    const response = await ChangeBitOfProvider(
      providerId,
      index,
      bookedSlot.slotTiming / 30
    );
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
  } catch (error: any) {
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
