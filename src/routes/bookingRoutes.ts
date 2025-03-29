import express from "express";
import {
  createBooking,
  getBookings,
  deleteBooking,
  acceptBooking,
  updateBooking,
  getBookingDetails,
  getConfirmBooking,
  applyPoints,
  removeAppliedPoints,
  getLiveOrdersOfProvider,
} from "../controllers/bookingController";
import { authorizeRoles, isAuthenticated } from "../middleware/authorised";

const router = express.Router();
router.post("/test", (req, res) => {
  res.send("w0w");
});
router.post("/initiate", isAuthenticated, createBooking); // Create booking from cart
router.get("/all", isAuthenticated, getBookings); // Get all bookings for a user
router.post("/confirm-booking", (req, res, next) => { console.log("wow"); next(); }, updateBooking);
router.get("/:bookingId", getBookingDetails);
router.post("/confirm-booking-details", getConfirmBooking);
router.delete(
  "/:bookingId",
  isAuthenticated,
  authorizeRoles("user"),
  deleteBooking
); // Delete booking
router.post("/accept", acceptBooking);
router.post("/apply-points",isAuthenticated, applyPoints);
router.post("/remove-points", isAuthenticated, removeAppliedPoints);
router.post("/live-order-provider",isAuthenticated,getLiveOrdersOfProvider);

export default router;
