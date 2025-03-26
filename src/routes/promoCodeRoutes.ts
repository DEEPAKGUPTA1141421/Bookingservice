import { Router } from "express";
import {
  createPromoCode,
  getPromoCodes,
  getPromoCodeById,
  updatePromoCode,
  deletePromoCode,
  applyPromoCode,

} from "../controllers/promoCodeController";
import { authorizeRoles, isAuthenticated } from "../middleware/authorised";

const router = Router();

router.post("/create", createPromoCode);  // Create Promo Code
router.get("/",getPromoCodes);  // Get all Promo Codes
router.get("/:id",isAuthenticated,authorizeRoles("user","admin"), getPromoCodeById);  // Get Promo Code by ID
router.put("/:id",isAuthenticated, authorizeRoles("admin"), updatePromoCode);  // Update Promo Code
router.delete("/:id",isAuthenticated, authorizeRoles("admin"), deletePromoCode);  // Delete Promo Code
router.post("/apply-code",applyPromoCode);  // Apply Promo Code

export default router;
