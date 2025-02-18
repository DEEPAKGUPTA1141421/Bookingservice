import express from "express";
import {
  createBooking,
  updateBooking,
  getBookings,
  deleteBooking,
} from "../controllers/bookingController";
import { bookingLimiter } from "../middleware/rateLimiter";

const router = express.Router();

router.use(bookingLimiter);

router.post("/", createBooking); // Create booking from cart
router.get("/", getBookings); // Get all bookings for a user
router.put("/:bookingId", updateBooking); // Update booking details
router.delete("/:bookingId", deleteBooking); // Delete booking

export default router;
