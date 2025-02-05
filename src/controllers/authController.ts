import { Request, Response } from "express";
import pool from "../config/database";
import crypto from "crypto";
import {
  sendOtpSchema,
  verifyOtpSchema,
  editUserSchema,
} from "../validations/authcontroller_validation";
import { QueryResult } from "pg";
import bcrypt from "bcryptjs";

const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(req.body);
    const validation = sendOtpSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors });
      return;
    }
    const { phone } = req.body;
    console.log(req.body);

    const userResult = await pool.query(
      "SELECT user_id, status FROM users WHERE phone = $1",
      [phone]
    );

    let userId;
    let isNewUser: boolean = false;

    if (userResult.rows.length === 0) {
      const newUser: QueryResult<{ user_id: number }> = await pool.query(
        "INSERT INTO users (phone, status) VALUES ($1, 'unverified') RETURNING user_id",
        [phone]
      );
      userId = newUser.rows[0].user_id;
      isNewUser = true;
    } else {
      userId = userResult.rows[0].user_id;
    }

    const otp: string = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      "INSERT INTO otp (user_id, otp_code, expires_at) VALUES ($1, $2, $3)",
      [userId, hashedOtp, expiresAt]
    );

    console.log(`✅ OTP for ${phone}:`, otp);

    res.status(200).json({ message: "OTP sent successfully", isNewUser });
  } catch (error) {
    console.error("Error in sendOtp:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = verifyOtpSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors });
      return;
    }
    const { phone, otp } = req.body;

    const userResult: QueryResult<{ user_id: number }> = await pool.query(
      "SELECT user_id FROM users WHERE phone = $1",
      [phone]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userId = userResult.rows[0].user_id;

    const otpResult = await pool.query(
      "SELECT otp_id, otp_code, expires_at FROM otp WHERE user_id = $1 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    if (otpResult.rows.length === 0) {
      res.status(400).json({ error: "No valid OTP found" });
      return;
    }

    const { otp_id, otp_code, expires_at } = otpResult.rows[0];

    if (new Date(expires_at) < new Date()) {
      res.status(400).json({ error: "OTP expired" });
      return;
    }

    const hashedInputOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    if (hashedInputOtp !== otp_code) {
      res.status(400).json({ error: "Invalid OTP" });
      return;
    }

    await pool.query("UPDATE otp SET is_used = TRUE WHERE otp_id = $1", [
      otp_id,
    ]);
    await pool.query(
      "UPDATE users SET status = 'verified' WHERE user_id = $1",
      [userId]
    );
    await pool.query("DELETE FROM otp WHERE otp_id = $1", [otp_id]);

    res
      .status(200)
      .json({ message: "OTP verified successfully", user_id: userId });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = editUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors });
      return;
    }

    const { user_id } = req.params;
    let { name, email, phone, password, role } = req.body;

    const fieldsToUpdate: Record<string, any> = {};
    if (name?.trim()) fieldsToUpdate.name = name.trim();
    if (email?.trim()) fieldsToUpdate.email = email.trim();
    if (phone?.trim()) fieldsToUpdate.phone = phone.trim();
    if (role) fieldsToUpdate.role = role;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      fieldsToUpdate.password = await bcrypt.hash(password, salt);
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const updateFields = Object.keys(fieldsToUpdate)
      .map((key, idx) => `${key} = $${idx + 1}`)
      .join(", ");
    const values = Object.values(fieldsToUpdate);
    values.push(user_id);

    const query = `UPDATE users SET ${updateFields} WHERE user_id = $${values.length} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({
      message: "User updated successfully",
      user: result.rows[0],
    });
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

    const result = await pool.query(
      "DELETE FROM users WHERE user_id = $1 RETURNING *",
      [user_id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
