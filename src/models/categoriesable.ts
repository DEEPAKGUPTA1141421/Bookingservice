import pool from "../config/database";

export const createCategoriesTable = async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS categories (
        category_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT
      );
    `;
  
    try {
      await pool.query(query);
      console.log("✅ Categories table created successfully!");
    } catch (error) {
      console.error("❌ Error creating categories table:", error);
    }
};

export const insertCategories = async () => {
    const categories = [
      { name: "Women and Salon Spa", description: "Salon and spa services for women." },
      { name: "Mens and Salon Spa", description: "Salon and spa services for men." },
      { name: "AC and Appliance Repair", description: "Repair services for ACs and appliances." },
      { name: "Cleaning", description: "Home and office cleaning services." },
      { name: "Pest Control", description: "Pest removal and control services." },
      { name: "Electrician", description: "Electrical repair and installation services." },
      { name: "Plumber", description: "Plumbing and pipe fitting services." },
      { name: "Carpenter", description: "Woodwork and furniture repair services." },
      { name: "Water Related Problem", description: "Solutions for water leakage and related issues." },
      { name: "Painting", description: "Home and office painting services." },
      { name: "Waterproofing", description: "Waterproofing services for buildings and walls." },
      { name: "Wall Paints", description: "Professional wall painting services." },
      { name: "Product Delivery to a Specific Place", description: "Courier and product delivery services." }
    ];
  
    try {
      for (let category of categories) {
        await pool.query(
          `INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
          [category.name, category.description]
        );
        console.log(`✅  ${category.name} inserted successfully!`);
      }
    } catch (error) {
      console.error(`❌ Error inserting categories:", error`);
    }
};

export const dbcall = async () => {
    try {
      const query = `SELECT * FROM service_providers LIMIT 5;`;
      const { rows } = await pool.query(query);
  
      console.log("✅ Categories fetched successfully!", rows);
      return rows;
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      throw error;
    }
};

export const alterCategoriesTable = async () => {
    const query = `
      ALTER TABLE otp
        RENAME COLUMN category_id TO id;
  
      ALTER TABLE categories
        ADD COLUMN images TEXT[] DEFAULT '{}'::TEXT[];
    `;
  
    try {
      await pool.query(query);
      console.log("✅ Categories table altered successfully!");
    } catch (error) {
      console.error("❌ Error altering categories table:", error);
    }
};

export const alterOtpTable = async () => {
    const query = `
      ALTER TABLE otp
        RENAME COLUMN otp_id TO id;
    `;
  
    try {
      await pool.query(query);
      console.log("✅ Categories table altered successfully!");
    } catch (error) {
      console.error("❌ Error altering categories table:", error);
    }
};

export const alterUserTable = async () => {
    const query = `
      ALTER TABLE users
        RENAME COLUMN user_id TO id;
    `;
  
    try {
      await pool.query(query);
      console.log("✅ Categories table altered successfully!");
    } catch (error) {
      console.error("❌ Error altering categories table:", error);
    }
};
  