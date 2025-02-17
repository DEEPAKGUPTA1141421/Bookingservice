import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { Kafka } from "kafkajs";
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

// Kafka producer setup
const kafka = new Kafka({
  clientId: "my-app",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});
const producer = kafka.producer();

// Express app setup
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.get("/test", isAuthenticated, (req, res, next) => {
  res.status(200).json({ success: true });
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
const wss = new WebSocketServer({ server: server });

wss.on("connection", (ws) => {
  console.log("📡 New Provider Connected");

  // Send a welcome message to the connected provider
  ws.send(JSON.stringify({ message: "Hello World" }));

  // Listen for incoming messages from the WebSocket client
  ws.on("message", async (message: string) => {
    console.log(`📩 Received message: ${message}`);
    try {
      const { ActualService, providerId, latitude, longitude } =
        JSON.parse(message);

      // Send location update to Kafka
      await main("location-update", {
        key: ActualService,
        value: JSON.stringify({ providerId, latitude, longitude }),
      });

      console.log(`📍 Location sent to Kafka: ${providerId}`);
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  });
});
