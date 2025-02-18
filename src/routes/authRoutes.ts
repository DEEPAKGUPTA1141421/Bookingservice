import express from "express";
import {
  sendOtp,
  verifyOtp,
  editUser,
  deleteUser,
  logoutUser,
} from "../controllers/authController";
import upload from "../middleware/upload";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter";

const router = express.Router();

router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", otpLimiter, verifyOtp);
router.post("/edit/:id", upload.single("profilePicture"), editUser);
router.post("/logout", logoutUser);
router.delete("/delete/:user_id", authLimiter, deleteUser);

export default router;
