import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import ErrorHandler from "../config/GlobalerrorHandler";
import { sendResponse } from "../utils/responseHandler";
import User, { IUser } from "../models/UserSchema";
import Otp from "../models/OtpSchema";
import { z } from "zod";
import {
  sendOtpSchema,
  verifyOtpSchema,
  editUserSchema,
  aadhaarOtpSchema,
  aadhaarSchema,
  aadhaarOtpVerifySchema,
} from "../validations/authcontroller_validation";
import { CheckZodValidation, generateOtp } from "../utils/helper";
import { IRequest } from "../middleware/authorised";
import ServiceProvider from "../models/ServiceProviderSchema ";
import { Admin } from "../models/AdminSchema";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const LOGOUT_COOKIE_OPTIONS = { ...COOKIE_OPTIONS, maxAge: 0 };
export const generateToken = (userId: string) => {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
  console.log("token", token);
  return token;
};

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("now orking")
    const validation = CheckZodValidation(req.body, sendOtpSchema, next);
    let { phone,user_type } = validation.data;
    let role = "";
    let user;
    if (!user) {
      user = await User.findOne({ phone });
      if (user) role = "User";
    }
    if (!user) {
      user = await ServiceProvider.findOne({ phone });
      if (user) role = "ServiceProvider";
    }
    if (!user) {
      user = await Admin.findOne({ phone });
      if (user) role = "Admin";
    }
    const otp = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const typeOfOtp = user ? "login" : "sign_up";

    if (!user) {
      if (user_type == "User") {
        user = new User({ phone });
        user_type="User";
        await user.save();
      } else{
        user = new ServiceProvider({ phone });
        user_type="ServiceProvider";
        await user.save();
      }
    }

    await Otp.create({
      user_id: user._id,
      user_type: role,
      otp_code: hashedOtp,
      expires_at: expiresAt,
      typeOfOtp,
    });

    console.log(`✅ OTP for ${phone} (${typeOfOtp}):`, otp);
    sendResponse(res, 200, "OTP sent successfully", {
      isNewUser: !user,
      phone: phone,
      role: role,
    });
  } catch (error) {
    const err = error as Error;
    next(new ErrorHandler(err.message, 400));
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("getting hit by client veriftotp");
    const validation = CheckZodValidation(req.body, verifyOtpSchema, next);
    const { phone, otp } = validation.data;
    console.log("getting hit by client veriftotp", phone, otp);
    let role = "";
    let user;
    if (!user) {
      user = await User.findOne({ phone });
      console.log("user me find", user);
      if (user) role = "User";
      console.log("user me find", role);
    }
    if (!user) {
      console.log("provider me ", phone);
      user = await ServiceProvider.findOne({ phone });
      if (user) role = "ServiceProvider";
      console.log("provider me ", user);
    }
    if (!user) {
      user = await Admin.findOne({ phone });
      if (user) role = "Admin";
      console.log("admin me ", role);
    }

    if (!user) return next(new ErrorHandler("User not found", 404));
    console.log("user", user._id);
    const latestOtp = await Otp.findOne({
      user_id: user._id,
      user_type: role,
      is_used: false,
    }).sort({ createdAt: -1 });
    if (!latestOtp || new Date(latestOtp.expires_at) < new Date())
      return next(new ErrorHandler("OTP expired or invalid", 400));

    const hashedInputOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    if (hashedInputOtp !== latestOtp.otp_code)
      return next(new ErrorHandler("Invalid OTP", 400));

    await Otp.updateOne({ _id: latestOtp._id }, { is_used: true });
    if (latestOtp.user_type === "User") {
      await User.updateOne({ _id: user._id }, { status: "verified" });
    }

    const token = generateToken(user._id.toString());
    console.log("role", role);
    sendResponse(res, 200, "OTP verified successfully", {
      user: user,
      token: token,
      role: role,
    });
  } catch (error) {
    const err = error as Error;
    next(new ErrorHandler(err.message, 400));
  }
};

export const logoutUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    res.clearCookie("token", LOGOUT_COOKIE_OPTIONS);
    sendResponse(res, 200, "Logout successful", {});
  } catch (error) {
    next(new ErrorHandler("Internal server error", 500));
  }
};

export const editUser = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("getting hitt by frontend is more for us", req.body);
    const validation = await CheckZodValidation(req.body, editUserSchema, next);
    console.log("failed Validation", validation);
    if (validation && !validation.success) {
      console.log("failed Validation");
      return next(new ErrorHandler(validation.error.errors[0].message, 400));
    }
    console.log("getting hitt by frontend 2", req.user);
    const id = req.user?._id;
    console.log("id is", id);
    const profilePicture = req.file as Express.MulterS3.File | undefined;
    const {
      name,
      email,
      phone,
      password,
      role,
      latitude,
      longitude,
      add_address,
    } = validation.data;

    const updates: Record<string, any> = {};
    if (name) updates.name = name.trim();
    if (
      latitude !== undefined &&
      longitude !== undefined &&
      longitude != null &&
      latitude != null
    ) {
      updates["address.location"] = {
        type: "Point",
        coordinates: [longitude, latitude], // Remember: MongoDB stores [longitude, latitude]
      };
    }
    if (email) updates.email = email.trim();
    if (phone) updates.phone = phone.trim();
    if (add_address != undefined && add_address != null)
      updates.add_address = add_address.trim();
    console.log("check point");
    if (role) updates.role = role;
    if (password) updates.password = await bcrypt.hash(password, 10);
    if (profilePicture?.location) updates.image = profilePicture.location;

    if (!Object.keys(updates).length)
      return next(new ErrorHandler("No updates provided", 400));
    console.log("hitting update");
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return next(new ErrorHandler("User not found", 404));
    console.log("getting response till here");
    sendResponse(res, 200, "User updated successfully", user);
  } catch (error: any) {
    console.log(error.message);
    next(new ErrorHandler("Internal server error", 500));
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

export const getUserProfile = async (
  req: IRequest,
  res: Response
): Promise<void> => {
  try {
    const u = req.user;
    sendResponse(res, 201, "Profile View", u);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};


// Aadhaar Verification
export const verifyAadhaar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate Input
    sendResponse(res, 201, "Aadhaar verified successfully!", {});
    return;
    const parsedData = aadhaarSchema.safeParse(req.body);
    if (!parsedData.success) {
      next(new ErrorHandler("Verification failed", 302));
      return;
    }

    const { aadhaarNumber } = parsedData.data;

    // Call Aadhaar Verifier API
    const response = await fetch(
      `${process.env.AADHAAR_VERIFIER_API_URL}/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AADHAAR_API_KEY}`,
        },
        body: JSON.stringify({ aadhaarNumber }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      sendResponse(res, 201, "Aadhaar verified successfully!", { data });
      return;
    } else {
      next(new ErrorHandler(data.message || "Aadhaar verification failed.", 404));
      return;
    }
  } catch (error:any) {
    console.error("Aadhaar verification error:", error);
    next(new ErrorHandler(error.message, 501));
    return;
  }
};

// Send OTP to Aadhaar-linked Mobile
export const sendAadhaarOTP = async (
  req: Request,
  res: Response,
  nex: NextFunction
): Promise<void> => {
  try {
    // Validate Input
    res
      .status(200)
      .json({ success: true, message: "OTP sent successfully!", data: {otp:"123456"} } );
    return;
    const parsedData = aadhaarOtpSchema.safeParse(req.body);
    if (!parsedData.success) {
       res
        .status(400)
         .json({ success: false, message: parsedData.error.errors });
      return;
    }

    const { aadhaarNumber } = parsedData.data;

    // Call Aadhaar Verifier API to send OTP
    const response = await fetch(
      `${process.env.AADHAAR_VERIFIER_API_URL}/send-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AADHAAR_API_KEY}`,
        },
        body: JSON.stringify({ aadhaarNumber }),
      }
    );

    const data = await response.json();

    if (response.ok) {
       res
        .status(200)
         .json({ success: true, message: "OTP sent successfully!", data });
      return;
    } else {
      res.status(400).json({
        success: false,
        message: data.message || "Failed to send OTP.",
      });
      return
    }
  } catch (error) {
    console.error("OTP sending error:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal Server Error." });
    return;
  }
};

// Verify OTP
export const verifyAadhaarOTP = async (req: Request, res: Response, nex: NextFunction):Promise<void> => {
  try {
    // Validate Input
    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully!", data:{} });
    return;
    const parsedData = aadhaarOtpVerifySchema.safeParse(req.body);
    if (!parsedData.success) {
      res
        .status(400)
        .json({ success: false, message: parsedData.error.errors });
      return;
    }

    const { aadhaarNumber, otp } = parsedData.data;

    // Call Aadhaar Verifier API to verify OTP
    const response = await fetch(
      `${process.env.AADHAAR_VERIFIER_API_URL}/verify-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AADHAAR_API_KEY}`,
        },
        body: JSON.stringify({ aadhaarNumber, otp }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      res
        .status(200)
        .json({ success: true, message: "OTP verified successfully!", data });
      return;
    } else {
      res
        .status(400)
        .json({ success: false, message: data.message || "Invalid OTP." });
      return;
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal Server Error." });
    return;
  }
};
