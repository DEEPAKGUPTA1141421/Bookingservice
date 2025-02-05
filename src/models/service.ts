import pool from "../config/database";

export const createServicesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS services (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      category_id UUID NOT NULL,
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      images TEXT[] DEFAULT '{}'::TEXT[],
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `;

  try {
    await pool.query(query);
    console.log("✅ Services table created successfully!");
  } catch (error) {
    console.error("❌ Error creating services table:", error);
  }
};
