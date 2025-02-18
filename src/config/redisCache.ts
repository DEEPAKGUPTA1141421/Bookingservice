import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

console.log("🔍 Redis URL:", process.env.REDIS_URL);


const redisClient = new Redis(process.env.REDIS_URL as string);

redisClient.on("connect", () => console.log("✅ Connected to Redis Cloud"));
redisClient.on("error", (err) => console.error("❌ Redis Error:", err));

export default redisClient;
