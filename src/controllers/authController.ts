import pool from "../config/database";
import crypto from "crypto";
import { Request, Response } from "express";
import { sendOtpSchema, verifyOtpSchema } from "../validations/authcontroller_validation";
import { QueryResult } from "pg";

const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtp = async (req: Request, res: Response): Promise<Response> => {
  console.log(req.body);
  const validation = sendOtpSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors });
   
  }
  const { phone } = req.body;
  console.log(req.body);
  try {
    const userResult = await pool.query(
      "SELECT user_id, status FROM users WHERE phone = $1",
      [phone]
    );

    let userId;
    let isNewUser:boolean = false;

    if (userResult.rows.length === 0) {
      const newUser:QueryResult<{ user_id: number }> = await pool.query(
        "INSERT INTO users (phone, status) VALUES ($1, 'unverified') RETURNING user_id",
        [phone]
      );
      userId = newUser.rows[0].user_id;
      isNewUser = true;
    } else {
      userId = userResult.rows[0].user_id;
    }

    const otp:string = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    await pool.query(
      "INSERT INTO otp (user_id, otp_code, expires_at) VALUES ($1, $2, $3)",
      [userId, hashedOtp, expiresAt]
    );

    console.log(`✅ OTP for ${phone}:`, otp); // In real case, send via SMS

    return res.status(200).json({ message: "OTP sent successfully", isNewUser });
  } catch (error) {
    console.error("Error in sendOtp:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<Response> => {
  const validation = verifyOtpSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors });
  }
  const { phone, otp } = req.body;
  try {
    const userResult:QueryResult<{ user_id: number }> = await pool.query(
      "SELECT user_id FROM users WHERE phone = $1",
      [phone]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].user_id;

    const otpResult = await pool.query(
      "SELECT otp_id, otp_code, expires_at FROM otp WHERE user_id = $1 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: "No valid OTP found" });
    }

    const { otp_id, otp_code, expires_at } = otpResult.rows[0];

    if (new Date(expires_at) < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    const hashedInputOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    if (hashedInputOtp !== otp_code) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    await pool.query("UPDATE otp SET is_used = TRUE WHERE otp_id = $1", [
      otp_id,
    ]);

    await pool.query(
      "UPDATE users SET status = 'verified' WHERE user_id = $1",
      [userId]
    );

    await pool.query("DELETE FROM otp WHERE otp_id = $1", [otp_id]);

    return res.status(200).json({
      message: "OTP verified successfully",
      user_id: userId,
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
