import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ErrorHandler from "../config/GlobalerrorHandler";
import { sendResponse } from "../utils/responseHandler";
import User from "../models/UserSchema";
import Otp from "../models/OtpSchema";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const LOGOUT_COOKIE_OPTIONS = { ...COOKIE_OPTIONS, maxAge: 0 };
const generateToken = (userId: string) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

const editUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  role: z.enum(["user", "admin", "provider"]).optional(),
});

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone } = sendOtpSchema.parse(req.body);
    let user = await User.findOne({ phone });
    console.log(`we are here ${user}`);

    if (!user) {
      user = new User({ phone });
      await user.save();
    }

    const otp = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const newotp = await Otp.create({
      user_id: user._id,
      otp_code: hashedOtp,
      expires_at: expiresAt,
      typeOfOtp: "sign_up",
    });

    // await client.messages.create({
    //   body: Urban Cap: Your verification code is ${otp}. Please enter this code to verify your account. This code is valid for 5 minutes. Do not share it with anyone. If you didn’t request this, please ignore this message.,
    //   to: +91${phone},
    //   from: mynumber,
    // });

    console.log(`✅ OTP for ${phone}:`, otp);
    sendResponse(res, 200, "OTP sent successfully", { isNewUser: !user });
  } catch (error) {
    res.status(400).json({
      error: error instanceof z.ZodError ? error.errors : "Invalid request",
    });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = verifyOtpSchema.parse(req.body);
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

    const token = generateToken(user._id.toString());
    res.cookie("token", token, COOKIE_OPTIONS);

    res
      .status(200)
      .json({ message: "OTP verified successfully", user_id: user._id });
  } catch (error) {
    res.status(400).json({
      error: error instanceof z.ZodError ? error.errors : "Invalid request",
    });
  }
};

export const logoutUser = (req: Request, res: Response): void => {
  try {
    res.clearCookie("token", LOGOUT_COOKIE_OPTIONS);
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const profilePicture = req.file as Express.MulterS3.File | undefined;

    const parsedData = editUserSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({ error: parsedData.error.format() });
      return;
    }

    const { name, email, phone, password, role } = parsedData.data;
    const updates: Record<string, any> = {};

    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim();
    if (phone) updates.phone = phone.trim();
    if (role) updates.role = role;
    if (password) updates.password = await bcrypt.hash(password, 10);

    if (profilePicture && profilePicture.location) {
      updates.image = profilePicture.location;
    }

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

    res.clearCookie("token", LOGOUT_COOKIE_OPTIONS);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
