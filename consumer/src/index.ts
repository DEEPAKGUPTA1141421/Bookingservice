import mongoose, { Document, Types, Schema } from "mongoose";
import cluster from "cluster";
import os from "os";
import { Kafka, EachMessagePayload } from "kafkajs";
import Redis from "ioredis";
import dotenv from "dotenv";
import { connectDb } from "./database";
import ServiceProvider from "./ServiceProviderSchema";

dotenv.config();
connectDb();

const BULK_SIZE = 1000;
const BULK_UPDATE_INTERVAL = 60 * 1000; // 1 minute

// Redis client setup
const redisClient = new Redis(process.env.REDIS1_URL || "redis://localhost");

// Kafka consumer setup
const kafka = new Kafka({
  clientId: "location-consumer",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "location-group" });

if (cluster.isPrimary) {
  // Master process (primary) will spawn worker processes
  const numWorkers = os.cpus().length;
  console.log(`Master process running, spawning ${numWorkers} workers...`);

  for (let i = 0; i < numWorkers - 1; i++) cluster.fork();

  // Spawn a dedicated worker for bulk updating MongoDB
  cluster.fork({ BULK_UPDATE_PROCESS: "true" });

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} crashed. Restarting...`);
    cluster.fork();
  });
} else if (process.env.BULK_UPDATE_PROCESS === "true") {
  // Worker for bulk updating MongoDB
  console.log(`🚀 Bulk update worker ${process.pid} started`);

  // Run bulk update every 1 minute
  setInterval(() => {
    bulkUpdateToMongo().catch(console.error);
  }, BULK_UPDATE_INTERVAL);
} else {
  // Worker for consuming location updates
  (async () => {
    await consumer.connect();
    await consumer.subscribe({
      topic: "location-update",
      fromBeginning: false,
    });

    console.log(`🚀 Worker ${process.pid} started consuming messages`);

    await consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        const messageValue = message.value?.toString();
        const ActualService = message.key?.toString();
        console.log("message",messageValue);
        if (!messageValue) {
          console.warn(`⚠️ Worker ${process.pid} received an empty message`);
          return;
        }

        const { providerId, latitude, longitude } = JSON.parse(messageValue);
        if (!ActualService) return;

        // Add the location to Redis under the corresponding key (service provider's actual service)
        await redisClient.geoadd(`geo:${ActualService}`,longitude,latitude,providerId);
        // Store provider IDs separately for bulk updates
        await redisClient.sadd(`providers:${ActualService}`, providerId);
        // expire the keys after 10 minutes
        await redisClient.expire(`geo:${ActualService}`, 600);
        await redisClient.expire(`providers:${ActualService}`, 600);
      },
    });
  })();
}

// ✅ Bulk Update Function
async function bulkUpdateToMongo() {
  console.log(`🔄 Starting bulk update to MongoDB...`);

  // Fetch all service categories dynamically
  const serviceCategories = await redisClient.keys("geo:*"); // Example: ["geo:Plumbing", "geo:Electrician"]

  let totalUpdated = 0;

  for (const serviceKey of serviceCategories) {
    const actualService = serviceKey.split(":")[1]; // Extract service name

    // Fetch all providers under this service category
    const providerIds = await redisClient.smembers(
      `providers:${actualService}`
    );

    if (providerIds.length === 0) continue;

    const bulkOps = [];

    for (const providerId of providerIds) {
      // Get the geo position for each provider from Redis
      const geoData = await redisClient.geopos(serviceKey, providerId);
      if (!geoData || !geoData[0]) continue;

      const [longitude, latitude] = geoData[0];

      // Prepare MongoDB bulk write operation
      bulkOps.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(providerId) },
          update: {
            $set: {
              "address.location": {
                type: "Point",
                coordinates: [longitude, latitude],
              },
            },
          },
        },
      });
    }

    // Perform the bulk update in MongoDB
    if (bulkOps.length > 0) {
      const result = await ServiceProvider.bulkWrite(bulkOps);
      console.log(
        `✅ Updated: ${result.modifiedCount}, Inserted: ${result.upsertedCount}`
      );
      totalUpdated += result.modifiedCount;
    }
  }

  console.log(`✅ Total updated: ${totalUpdated} service providers.`);
}
