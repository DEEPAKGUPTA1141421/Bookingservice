import express from "express";
import {
  sendOtp,
  verifyOtp,
  editUser,
  deleteUser,
  logoutUser,
  getUserProfile,
} from "../controllers/authController";
import upload from "../middleware/upload";
import { authorizeRoles, isAuthenticated } from "../middleware/authorised";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.get("/getprofile", isAuthenticated, getUserProfile);
router.post("/verify-otp", verifyOtp);
router.post("/edit",isAuthenticated,authorizeRoles("user"), upload.single("profilePicture"), editUser);
router.post("/logout", isAuthenticated, authorizeRoles("user"), logoutUser);
router.delete(
  "/delete/:user_id",
  isAuthenticated,
  authorizeRoles("user"),
  deleteUser
);

export default router;
