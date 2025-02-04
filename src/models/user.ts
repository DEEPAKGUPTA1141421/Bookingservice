import pool from "../config/database";

export const createUsersTable = async () => {
  const query = `
        CREATE TABLE IF NOT EXISTS users (
        user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255),  
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password TEXT,
        role VARCHAR(20) CHECK (role IN ('user', 'provider', 'admin')) DEFAULT 'user',
        status VARCHAR(20) CHECK (status IN ('verified', 'unverified')) DEFAULT 'unverified',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log("✅ Users table created successfully!");
  } catch (error) {
    console.error("❌ Error creating users table:", error);
  }
};
