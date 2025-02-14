import { Request, Response } from "express";
import {
  createBookingService,
  updateBookingService,
  getBookingsService,
  deleteBookingService,
} from "../services/bookingService";
import {
  createBookingSchema,
  updateBookingSchema,
} from "../validations/booking_validation";
import ErrorHandler from "../config/GlobalerrorHandler";

export const createBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.body._id;
    const validation = createBookingSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ErrorHandler(validation.error.message, 400);
    }

    const booking = await createBookingService(userId, validation.data.address);
    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (error) {
    const err =
      error instanceof ErrorHandler
        ? error
        : new ErrorHandler("Internal server error", 500);
    res.status(err.statusCode).json({ message: err.message });
  }
};

export const updateBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const validation = updateBookingSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ErrorHandler(validation.error.message, 400);
    }

    const status =
      validation.data.status === "canceled"
        ? "cancelled"
        : validation.data.status;

    const booking = await updateBookingService(
      bookingId,
      status,
      validation.data.scheduledTime
        ? new Date(validation.data.scheduledTime).toISOString()
        : undefined,
      validation.data.completedTime
        ? new Date(validation.data.completedTime).toISOString()
        : undefined
    );

    res.status(200).json({ message: "Booking updated successfully", booking });
  } catch (error) {
    const err =
      error instanceof ErrorHandler
        ? error
        : new ErrorHandler("Error updating booking", 500);
    res.status(err.statusCode).json({ message: err.message });
  }
};

export const getBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.body._id;
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
