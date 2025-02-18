import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
} from "../controllers/cartController";
import { authorizeRoles, isAuthenticated } from "../middleware/authorised";


const router = express.Router();

router.post("/add", isAuthenticated, authorizeRoles("user"), addToCart);
router.get("/getitems/:id", isAuthenticated, authorizeRoles("user"), getCart);
router.delete("/remove/:itemId",isAuthenticated,authorizeRoles("user"), removeFromCart);

export default router;
