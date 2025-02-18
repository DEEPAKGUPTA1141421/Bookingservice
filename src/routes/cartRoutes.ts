import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
} from "../controllers/cartController";
import { apiLimiter } from "../middleware/rateLimiter";

const router = express.Router();

router.use(apiLimiter);

router.post("/add", addToCart);
router.get("/getitems/:id", getCart);
router.delete("/remove/:itemId", removeFromCart);

export default router;
