import express, { Router } from "express";
import { getAvailableSlots, bookSlot } from "../controllers/slotController";

const router: Router = express.Router();

router.get("/availability", getAvailableSlots);
router.post("/book-slot", bookSlot);
// router.get("/booked-slots/:providerId", getBookedSlots);

export default router;
