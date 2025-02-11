import express from "express";
import {
  sendOtp,
  verifyOtp,
  editUser,
  deleteUser,
  logoutUser,
} from "../controllers/authController";
import upload from "../middleware/upload";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/edit/:id", upload.single("profilePicture"), editUser);
router.post("/logout", logoutUser);
router.delete("/delete/:user_id", deleteUser);

export default router;
