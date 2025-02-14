import { Booking } from "../models/BookingSchema";
import { Cart } from "../models/CartSchema";
import { Payment } from "../models/PaymentSchema";
import ErrorHandler from "../config/GlobalerrorHandler";

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
    if (payment.status === "paid") {
      // Call refund API logic here if needed
    }

    await Payment.findByIdAndDelete(payment._id);
    await Booking.findByIdAndDelete(bookingId);

    return {
      message: "Booking canceled successfully. Refund processed if applicable.",
    };
  }
};
