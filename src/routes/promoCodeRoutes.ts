import { Router } from "express";
import {
  createPromoCode,
  getPromoCodes,
  getPromoCodeById,
  updatePromoCode,
  deletePromoCode,
  applyPromoCode,
} from "../controllers/promoCodeController";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.use(apiLimiter);

router.post("/", createPromoCode);  // Create Promo Code
router.get("/", getPromoCodes);  // Get all Promo Codes
router.get("/:id", getPromoCodeById);  // Get Promo Code by ID
router.put("/:id",  updatePromoCode);  // Update Promo Code
router.delete("/:id",  deletePromoCode);  // Delete Promo Code
router.post("/apply", applyPromoCode);  // Apply Promo Code

export default router;
