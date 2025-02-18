import express, { Router } from "express";
import { getAvailableSlots, bookSlot } from "../controllers/slotController";
import { isAuthenticated } from "../middleware/authorised";

const router: Router = express.Router();

router.get("/availability",isAuthenticated, getAvailableSlots);
router.post("/book-slot",isAuthenticated, bookSlot);
// router.get("/booked-slots/:providerId", getBookedSlots);

export default router;
