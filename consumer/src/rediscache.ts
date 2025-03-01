import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

console.log("🔍 Redis URL:", process.env.REDIS_URL);

let redisClient: Redis | null = null;

export const createRedisClient = (): Redis => {
  try {
    if (redisClient) {
      console.log("♻️ Using existing Redis connection");
      return redisClient;
    }

    if (!process.env.REDIS_URL) {
      throw new Error("❌ REDIS_URL is not defined in environment variables.");
    }

    redisClient = new Redis(process.env.REDIS_URL);

    redisClient.on("connect", () => console.log("✅ Connected to Redis Cloud"));
    redisClient.on("error", (err) => console.error("❌ Redis Error:", err));

    return redisClient;
  } catch (error) {
    console.error("❌ Failed to initialize Redis:", error);
    throw error;
  }
};

