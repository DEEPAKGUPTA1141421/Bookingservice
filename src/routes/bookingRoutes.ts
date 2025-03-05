import express from "express";
import {
  createBooking,
  updateBooking,
  getBookings,
  deleteBooking,
  acceptBooking,
} from "../controllers/bookingController";
import { authorizeRoles, isAuthenticated } from "../middleware/authorised";

const router = express.Router();

router.post("/initiate", isAuthenticated, createBooking); // Create booking from cart
router.get("/", isAuthenticated, authorizeRoles("user"), getBookings); // Get all bookings for a user
router.put("/:bookingId",isAuthenticated,authorizeRoles("user"), updateBooking); // Update booking details
router.delete("/:bookingId", isAuthenticated, authorizeRoles("user"), deleteBooking); // Delete booking
router.post("/accept", acceptBooking);

export default router;
