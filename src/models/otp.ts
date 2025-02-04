import pool from "../config/database";

export const createOtpTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS otp (
      otp_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
      otp_code VARCHAR(64) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      is_used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log("✅ OTP table created successfully!");
  } catch (error) {
    console.error("❌ Error creating OTP table:", error);
  }
};
