import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import ErrorHandler from "../config/GlobalerrorHandler";
import { sendResponse } from "../utils/responseHandler";
import User from "../models/UserSchema";
import Otp from "../models/OtpSchema";

const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({ phone, status: "unverified" });
      await user.save();
    }

    const otp = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.create({
      user_id: user._id,
      otp_code: hashedOtp,
      expires_at: expiresAt,
      typeOfOtp: "sign_up",
    });

    console.log(`✅ OTP for ${phone}:`, otp);
    sendResponse(res, 200, "OTP sent successfully", !user);
  } catch (error: any) {
    console.error("Error in sendOtp:", error);
    throw new ErrorHandler(error.message, 400);
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const latestOtp = await Otp.findOne({
      user_id: user._id,
      is_used: false,
    }).sort({ createdAt: -1 });
    if (!latestOtp || new Date(latestOtp.expires_at) < new Date()) {
      res.status(400).json({ error: "OTP expired or invalid" });
      return;
    }

    const hashedInputOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    if (hashedInputOtp !== latestOtp.otp_code) {
      res.status(400).json({ error: "Invalid OTP" });
      return;
    }

    await Otp.updateOne({ _id: latestOtp._id }, { is_used: true });
    await User.updateOne({ _id: user._id }, { status: "verified" });

    res
      .status(200)
      .json({ message: "OTP verified successfully", user_id: user._id });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, role } = req.body;
    const profilePicture = req.file as Express.MulterS3.File | undefined;
    const updates: Record<string, any> = {};

    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim();
    if (phone) updates.phone = phone.trim();
    if (role) updates.role = role;
    if (password) updates.password = await bcrypt.hash(password, 10);
    if (profilePicture) updates.image = profilePicture.location;

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error in editUser:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user_id } = req.params;
    const user = await User.findByIdAndDelete(user_id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
