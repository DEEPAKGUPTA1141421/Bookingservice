import express from "express";
import {
  createBooking,
  getBookings,
  deleteBooking,
  acceptBooking,
  updateBooking,
  getBookingDetails,
  getConfirmBooking,
} from "../controllers/bookingController";
import { authorizeRoles, isAuthenticated } from "../middleware/authorised";

const router = express.Router();

router.post("/initiate", isAuthenticated, createBooking); // Create booking from cart
router.get("/all", isAuthenticated, getBookings); // Get all bookings for a user
router.post("/confirm-booking", isAuthenticated, updateBooking);
router.get("/:bookingId", getBookingDetails);
router.post("/confirm-booking-details", getConfirmBooking);
router.delete(
  "/:bookingId",
  isAuthenticated,
  authorizeRoles("user"),
  deleteBooking
); // Delete booking
router.post("/accept", acceptBooking);

export default router;
