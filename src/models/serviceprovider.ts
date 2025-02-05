import pool from "../config/database";
export const createServiceProvidersTable = async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS service_providers (
        name VARCHAR(255),  
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20) UNIQUE NOT NULL,
        image VARCHAR(255),  
        role VARCHAR(20) CHECK (role IN ('user', 'provider', 'admin')) DEFAULT 'provider',
        status VARCHAR(20) CHECK (status IN ('verified', 'unverified')) DEFAULT 'unverified',
        company_name VARCHAR(255),
        license_no VARCHAR(50) UNIQUE NOT NULL,
        rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  
    try {
      await pool.query(query);
      console.log("✅ Service Providers table created successfully!");
    } catch (error) {
      console.error("❌ Error creating service_providers table:", error);
    }
};
  