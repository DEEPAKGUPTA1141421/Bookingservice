import express from "express";
import { sendOtp, verifyOtp, editUser, deleteUser } from "../controllers/authController";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/edit/:user_id", editUser);
router.delete("/delete/:user_id", deleteUser);

export default router;
