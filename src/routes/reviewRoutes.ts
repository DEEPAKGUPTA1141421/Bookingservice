import express from "express";
import {
  createReviewController,
  getAllReviewsController,
  getReviewByIdController,
  updateReviewController,
  deleteReviewController,
} from "../controllers/reviewController";
import { reviewLimiter } from "../middleware/rateLimiter";

const router = express.Router();

router.use(reviewLimiter);

router.post("/reviews", createReviewController); // ✅ Create Review
router.get("/reviews", getAllReviewsController); // ✅ Get All Reviews
router.get("/reviews/:id", getReviewByIdController); // ✅ Get Review by ID
router.put("/reviews/:id", updateReviewController); // ✅ Update Review
router.delete("/reviews/:id", deleteReviewController); // ✅ Delete Review

export default router;
