import express, { Router } from "express";
import {
  getAvailableSlots,
  bookSlot,
  getBookedSlots,
} from "../controllers/slotController";
import { bookingLimiter } from "../middleware/rateLimiter";

const router = express.Router();

router.use(bookingLimiter);

router.get("/availability/:providerId", getAvailableSlots);
router.post("/book-slot", bookSlot);
router.get("/booked-slots/:providerId", getBookedSlots);

export default router;
