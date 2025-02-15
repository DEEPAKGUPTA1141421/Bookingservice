import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
} from "../controllers/cartController";


const router = express.Router();

router.post("/add", addToCart);
router.get("/getitems/:id", getCart);
router.delete("/remove/:itemId", removeFromCart);

export default router;
