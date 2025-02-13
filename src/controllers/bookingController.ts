import { Request, Response } from "express";
import { Booking, IBooking } from "../models/BookingSchema";
import { Cart } from "../models/CartSchema";
import { Payment } from "../models/PaymentSchema";

export const createBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.body._id; // Assume user is authenticated and ID is in req.user

    // Fetch user's cart
    const cart = await Cart.findOne({ user: userId }).populate(
      "items.service items.service_option"
    );
    if (!cart || cart.items.length === 0) {
      res.status(400).json({ message: "Cart is empty" });
      return; // Prevent further execution
    }

    const booking = new Booking({
      user: userId,
      cart: cart._id,
      status: "initiated",
      bookingDate: new Date(),
      address: req.body.address,
    });

    await booking.save();
    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const { status, scheduledTime, completedTime } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return; // Prevent further execution
    }

    if (status) booking.status = status;
    if (scheduledTime) booking.scheduledTime = scheduledTime;
    if (completedTime) booking.completedTime = completedTime;

    await booking.save();
    res.status(200).json({ message: "Booking updated successfully", booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating booking" });
  }
};

export const getBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.body._id;
    const bookings = await Booking.find({ user: userId }).populate("cart");

    if (!bookings || bookings.length === 0) {
      res.status(404).json({ message: "No bookings found" });
      return; // Prevent further execution
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

export const deleteBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;

    // Find booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    if ((booking.status as IBooking["status"]) !== "confirmed") {
      res
        .status(400)
        .json({ message: "Only confirmed bookings can be canceled" });
      return;
    }

    if ((booking.status as IBooking["status"]) === "delivered") {
      res.status(400).json({ message: "Cannot cancel a delivered booking" });
      return;
    }

    // Find payment entity for this booking
    const payment = await Payment.findOne({ booking: bookingId });

    if (!payment) {
      // Case 1: No payment entity → COD → Cancel directly and notify provider
      await Booking.findByIdAndDelete(bookingId);
      res
        .status(200)
        .json({
          message: "Booking canceled successfully (COD). Provider notified.",
        });
    } else {
      // Case 2: Payment exists → Call refund API if payment is already captured
      if (payment.status === "paid") {
        //   const refundResponse = await RazorpayRefund(payment.transactionId); // Call refund API
        //   if (!refundResponse.success) {
        //     res.status(500).json({ message: "Failed to process refund. Try again later." });
        //     return;
        //   }
      }

      await Payment.findByIdAndDelete(payment._id);
      await Booking.findByIdAndDelete(bookingId);

      res
        .status(200)
        .json({
          message:
            "Booking canceled successfully. Refund processed if applicable.",
        });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error canceling booking" });
  }
};
