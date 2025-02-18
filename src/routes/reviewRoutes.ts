import express from "express";
import {
  createReviewController,
  getAllReviewsController,
  getReviewByIdController,
  updateReviewController,
  deleteReviewController,
} from "../controllers/reviewController";
import { authorizeRoles, isAuthenticated } from "../middleware/authorised";

const router = express.Router();

router.post("/reviews",isAuthenticated,authorizeRoles("user"),createReviewController); // ✅ Create Review
router.get("/reviews",isAuthenticated,authorizeRoles("user"), getAllReviewsController); // ✅ Get All Reviews
router.get("/reviews/:id",isAuthenticated,authorizeRoles("user"), getReviewByIdController); // ✅ Get Review by ID
router.put("/reviews/:id",isAuthenticated,authorizeRoles("user"), updateReviewController); // ✅ Update Review
router.delete("/reviews/:id",isAuthenticated,authorizeRoles("user"), deleteReviewController); // ✅ Delete Review

export default router;
