import express from "express";
import cors from "cors";
import { WebSocket, WebSocketServer } from "ws";
import { Kafka } from "kafkajs";
import cookieParser from "cookie-parser";
import locationRoutes from "./routes/locationRoutes";
import otpRoutes from "./routes/authRoutes";
import AdminRoutes from "./routes/adminRoute";
import cartRoutes from "./routes/cartRoutes";
import ServiceRoutes from "./routes/serviceproviderRoute";
import findProvider from "./routes/findProvider";
import { errorMiddleware } from "./config/CustomErrorhandler";
import { isAuthenticated } from "./middleware/authorised";
import BookingRoutes from "./routes/bookingRoutes";
import { connectDb } from "./config/database";
import slotRoutes from "./routes/slotRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import PayemntRoutes from "./routes/paymentRoute";
import { sendRegistrationEmail } from "./config/mailer";
import { createRedisClient } from "./config/redisCache";
// Kafka producer setup
const kafka = new Kafka({
  clientId: "my-app",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});
const producer = kafka.producer();

// Express app setup
const app = express();
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Middleware for setting Content-Security-Policy
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "connect-src 'self' ws://localhost:4000"
  );
  next();
});

const port = 4000;
connectDb();

// Test endpoint
app.get("/test", async (req, res, next): Promise<void> => {
  try {
    const redis = createRedisClient();
    const pattern = "service_providers:*";

    const keys = await redis.keys(pattern);
    if (keys.length === 0) {
      res
        .status(404)
        .json({ success: false, message: "No service providers found" });
    }

    const result: Record<string, string[]> = {};

    for (const key of keys) {
      const keyType = await redis.type(key);

      if (keyType === "zset") {
        result[key] = await redis.zrange(key, 0, -1);
      } else {
        console.warn(
          `⚠️ Skipping key ${key} because it is a ${keyType}, not a sorted set.`
        );
      }
    }

    res.status(200).json({ success: true, result });
  } catch (error: any) {
    console.error("❌ Error fetching all providers:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    msg: "Server is up and running from my end!",
  });
});

// API Routes
app.use("/auth", otpRoutes);
app.use("/location", locationRoutes);
app.use("/admin", AdminRoutes);
app.use("/cart", cartRoutes);
app.use("/service-provider", ServiceRoutes);
app.use("/find-provider", findProvider);
app.use("/booking", BookingRoutes);
app.use("/slots", slotRoutes);
app.use("/review", reviewRoutes);
app.use("/payment", PayemntRoutes);

// Kafka message producer function
async function main(topic: string, message: any) {
  await producer.connect();
  await producer.send({
    topic: topic,
    messages: [message],
  });
}

// Error handling middleware
app.use(errorMiddleware);

// Create the HTTP server for Express
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// WebSocket server setup
export const wss = new WebSocketServer({ server: server });
// Store connected providers
export const connectedProviders = new Map<string, WebSocket>();

wss.on("connection", (ws, req) => {
  console.log("📡 New Provider Connected");

  ws.on("message", (message: string) => {
    const { type } = JSON.parse(message);
    if (type == "connection") {
      try {
        const { providerId } = JSON.parse(message);

        // Store provider's WebSocket connection
        if (providerId) {
          connectedProviders.set(providerId, ws);
          console.log(`✅ Provider ${providerId} connected`);
        } else {
          console.log("else" + JSON.parse(message));
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    } else {
      const { latitude, longitude } = JSON.parse(message);
      console.log("else" + latitude, longitude);
    }
  });

  ws.on("close", () => {
    // Remove provider on disconnect
    connectedProviders.forEach((socket, providerId) => {
      if (socket === ws) {
        connectedProviders.delete(providerId);
        console.log(`❌ Provider ${providerId} disconnected`);
      }
    });
  });
});
