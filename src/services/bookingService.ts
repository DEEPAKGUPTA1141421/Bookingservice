import { Booking } from "../models/BookingSchema";
import { Cart } from "../models/CartSchema";
import { Payment } from "../models/PaymentSchema";
import ErrorHandler from "../config/GlobalerrorHandler";
import { BookedSlot } from "../models/BookedSlotSchema";
import mongoose from "mongoose";
import { connectedProviders } from "..";
import { Type } from "aws-sdk/clients/cloudformation";
import {
  convertStringToObjectId,
  convertToHHMM,
  getBestProvider,
} from "../utils/helper";
import { ServiceProviderAvailability } from "../models/ServiceProviderAvailabilitySchema";
import { getIndex } from "./slotService";
import { Types } from "mongoose";
import { ServiceOption } from "../models/ActualServiceSchema";
import { updateActualService } from "./admin/actualServiceService";
import { boolean } from "zod";

interface BookingData {
  userId: Types.ObjectId | any;
  date: string; // YYYY-MM-DD format
  duration?: number;
  serviceoption: string;
  start_time: string | Date; // HH:MM format
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
  finalPrice: number;
  pointsUsed?: number;
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
      { name: 1, price: 1, discount_price: 1, discount_type: 1, upto: 1 }
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
      const price = serviceoprtiondoc.price; // Total price in paisa
      const discountPrice = serviceoprtiondoc.discount_price || 0; // Discount price in paisa
      const upto = serviceoprtiondoc.upto || 0; // Max discount limit in paisa
      const name = serviceoprtiondoc.name;
      // Ensure discount doesn't exceed price
      let discount = 0;
      if (serviceoprtiondoc.discount_type === "percent" && discountPrice > 0) {
        // Calculate percentage discount
        discount = Math.ceil((discountPrice * upto) / 100);
      } else if (serviceoprtiondoc.discount_type === "flat") {
        // Flat discount (directly in paisa)
        discount = discountPrice;
      }
      let taxes = Math.floor(((price - discount) * 18) / 100);
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
          name: name,
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
  console.log("check status",booking?.status)
  const res=await acceptBookingService(bookingId);
  if (!booking) {
    console.log("log Booking not found");
    throw new ErrorHandler("Booking not found", 404);
  }

  // Update fields if provided
  if (status) booking.status = status;
  if (address) booking.address = address;
  if (pointsUsed) booking.pointsUsed = pointsUsed;
  if (modeOfPayment) booking.modeOfPayment = modeOfPayment;
  if (finalPrice) booking.finalPrice = finalPrice - (pointsUsed || 0);
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
      .sort({ updatedAt: -1 }) // Sort by created_at DESC
      .limit(limit) // Limit results to 30
      .skip(offset); // Apply offset for pagination
    console.log("booking sort", bookings);
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

export const acceptBookingService = async (bookingId: string) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new ErrorHandler("Invalid booking Id", 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction(); // Begin transaction

  try {
    // ✅ Fetch booking with LOCK for updates
    const booking = await Booking.findOne({
      _id: bookingId, // Status should not be "confirmed"
    }).session(session);
    if (!booking) throw new ErrorHandler("Booking not found", 404);

    const bookedSlot = await BookedSlot.findOne({
      _id: booking.bookingSlot_id,
    }).session(session);
    if (!bookedSlot) throw new ErrorHandler("Booked slot not found", 404);

    let userId = booking.user;
    const previousProviders = bookedSlot.providers;

    // ✅ Remove other providers & keep only the accepting provider
    const providerId = await getBestProvider(bookedSlot.providers);
    bookedSlot.providers = [convertStringToObjectId(providerId)];
    await bookedSlot.save({ session });

    // ✅ Update booking status to confirmed
    booking.status = "confirmed";
    await booking.save({ session });
    console.log("confirmed done");

    // ✅ Update ServiceProviderAvailability (set available_bit to 0)
    let index: string | number = convertToHHMM(
      bookedSlot.start_time.toISOString()
    );
    if (!bookedSlot.slotTiming) {
      return { success: false, message: "Booking Failed" };
    }
    console.log("index before", index);
    index = getIndex(index);
    console.log("index access", index);
    const response = await ChangeBitOfProvider(
      providerId,
      index,
      bookedSlot.slotTiming / 15,
      bookedSlot.date
    );
    if (!response) {
      await session.abortTransaction(); // Rollback on error
      session.endSession();
      return { success: false, message: "Booking confirmed", providerId };
    }

    // ✅ Commit transaction (if everything is successful)
    await session.commitTransaction();
    session.endSession();

    // 🔔 Notify the User
    // const ws1 = connectedProviders.get(userId.toString());
    // if (ws1 && ws1.readyState === 1) {
    //   ws1.send(
    //     JSON.stringify({
    //       type: "BOOKING_CONFIRMED",
    //       message: "Your booking has been confirmed!",
    //       bookingId,
    //       data: { userId, providerId },
    //     })
    //   );
    // }
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
  numberOfSlots: number,
  date: Date
) => {
  try {
    const aviliblity = await ServiceProviderAvailability.findOne({
      provider: providerId,
      is_active: true,
      date: date,
    });

    console.log("Main Logic", aviliblity, timeIndex, numberOfSlots);

    if (!aviliblity || !aviliblity.available_bit) {
      return false;
    }

    console.log("Main Logic 2", aviliblity);

    let bitforchange = aviliblity.available_bit.split("");
    console.log("Main Logic 3", typeof bitforchange, timeIndex + numberOfSlots);

    for (let i = timeIndex; i < timeIndex + numberOfSlots; i++) {
      bitforchange[i] = "0";
    }

    console.log("Main Logic 4", bitforchange);
    aviliblity.available_bit = bitforchange.join("");

    await aviliblity.save(); // Save updated document

    console.log("Main Logic 5 Done");
    return true;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
};


export const checkConsecutive = (
  available_bit: any,
  timeIndex: number,
  numberOfSlots: number
): boolean => {
  available_bit=available_bit.split("");
  console.log("checkconsucutive", available_bit, timeIndex, numberOfSlots);
  if (timeIndex < 0 || timeIndex + numberOfSlots > available_bit.length)
    return false;

  // Check left boundary (if not the first slot)
  if (timeIndex > 0 && available_bit[timeIndex - 1] === "0") {
    return false;
  }

  // Check if all required slots are available
  for (let i = timeIndex; i < timeIndex + numberOfSlots; i++) {
    if (available_bit[i] === "0") {
      console.log("false condition get hit");
      return false; // Slot already booked
    }
  }

  // Check right boundary (if not the last slot)
  if (
    timeIndex + numberOfSlots < available_bit.length &&
    available_bit[timeIndex + numberOfSlots] === "0"
  ) {
    return false;
  }

  return true;
};
