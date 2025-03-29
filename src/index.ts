import express from "express";
import cors from "cors";
import cluster from "cluster";
import os from "os";
import { WebSocket, WebSocketServer } from "ws";
import cookieParser from "cookie-parser";
import locationRoutes from "./routes/locationRoutes";
import otpRoutes from "./routes/authRoutes";
import AdminRoutes from "./routes/adminRoute";
import cartRoutes from "./routes/cartRoutes";
import ServiceRoutes from "./routes/serviceproviderRoute";
import findProvider from "./routes/findProvider";
import promocode from "./routes/promoCodeRoutes";
import { errorMiddleware } from "./config/CustomErrorhandler";
import { isAuthenticated } from "./middleware/authorised";
import BookingRoutes from "./routes/bookingRoutes";
import { connectDb } from "./config/database";
import slotRoutes from "./routes/slotRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import PayemntRoutes from "./routes/paymentRoute";
import { sendRegistrationEmail } from "./config/mailer";
import { createRedisClient } from "./config/redisCache";
import ServiceProvider, {
  ServiceProviderSchema,
} from "./models/ServiceProviderSchema ";
import { getAddressFromLatLng } from "./services/locationservice";
import { getAccessToken } from "./services/FcmService";
import { ServiceOption } from "./models/ActualServiceSchema";

const numCPUs = os.cpus().length; // Number of CPU cores

// Create the Express app
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
export let connectedProviders:any=null;
export let wss:any=null
connectDb();

// Test endpoint
app.post("/send-notification", async (req, res) => {
  try {
    const { token, title, body } = req.body;
    const result = await getAccessToken();
    // You can use the access token here to make any API calls or send notifications
    res.json({ success: true, message: "Notification sent", result });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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

app.post("/ready", async (req, res, next): Promise<void> => {
  try {
    const { latitude, longitude } = req.body;
    const result = await getAddressFromLatLng(latitude, longitude);
    res.status(200).json({ success: true, result });
  } catch (error: any) {
    console.error("❌ Error fetching all providers:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Root endpoint
app.get("/", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Service options created successfully!",
    });
  } catch (error) {
    console.error("Error creating service options:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
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
app.use("/promocode", promocode);

// Error handling middleware
app.use(errorMiddleware);

if (cluster.isMaster) {
  // Master process: Fork worker processes for each CPU core
  console.log(`Master process started, forking ${numCPUs} workers`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork(); // Create a new worker for each CPU core
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Fork a new worker if one dies
  });
} else {
  // Worker processes (handles requests)
  const server = app.listen(port, () => {
    console.log(`Worker ${process.pid} is running on http://localhost:${port}`);
  });

  // WebSocket server setup
  wss = new WebSocketServer({ server: server });
  // Store connected providers
  connectedProviders = new Map<string, WebSocket>();

  wss.on("connection", async (ws: any, req:any) => {
    console.log("📡 New WebSocket Connection");

    ws.on("message", async (message: any) => {
      // Your logic here
      const { type } = JSON.parse(message);
      if (type == "Booking-Confirmed") {
        console.log("ws", ws);
        const { providerId, userId } = JSON.parse(message);
        const result1 = await createRedisClient().set(
          `socket:${userId}`,
          providerId
        );
        const result2 = await createRedisClient().set(
          `socket:${providerId}`,
          userId
        );
        console.log("Set Provider and User In Redis", result1, result2);
      } else if (type == "First-Connection") {
        console.log("Exchange The ids");
        const { id } = JSON.parse(message);
        connectedProviders.set(id, ws);
      } else if (type == "Realtime-Update") {
        const { id, latitude, longitude } = JSON.parse(message);
        const myWebSocket = connectedProviders.get(id);
        const otherId = await createRedisClient().get(`socket:${id}`);
        if (!otherId) {
          console.log("Connection is unavailable");
          return;
        }
        const otherWebSocket = connectedProviders.get(otherId);
        if (otherWebSocket && otherWebSocket.readyState === WebSocket.OPEN) {
          otherWebSocket.send(
            JSON.stringify({
              type: "get-Real-Time-Update",
              id: id,
              latitude: latitude,
              longitude: longitude,
            })
          );
        }
      }
    });
  });
}
