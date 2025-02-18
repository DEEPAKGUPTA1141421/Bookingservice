import express, { Router } from "express";
import { bookingLimiter } from "../middleware/rateLimiter";
import { getAvailableSlots, bookSlot } from "../controllers/slotController";

const router = express.Router();

router.use(bookingLimiter);

router.get("/availability", getAvailableSlots);
router.post("/book-slot", bookSlot);
// router.get("/booked-slots/:providerId", getBookedSlots);

export default router;
