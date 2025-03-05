import { createRedisClient } from "../config/redisCache";

const redis = createRedisClient();

// ✅ Store a WebSocket ID for a user or provider
export async function addSocketToRedis(
  id: string,
  socketId:string
): Promise<void> {
  await redis.set(`socket:${id}`, socketId);
  console.log(`🔗 Stored WebSocket for ${id}: ${socketId}`);
}

// ✅ Retrieve a WebSocket ID from Redis
export async function getSocketFromRedis(id: string): Promise<string | null> {
  return await redis.get(`socket:${id}`);
}

// ✅ Remove WebSocket ID when disconnected
export async function removeSocketFromRedis(id: string): Promise<void> {
  await redis.del(`socket:${id}`);
  console.log(`❌ Removed WebSocket for ${id}`);
}

// ✅ Store user-provider relationship (when an order is confirmed)
export async function addUserProviderMapping(
  userId: string,
  providerId: string
): Promise<void> {
  await redis.set(`order:${userId}`, providerId);
  await redis.set(`order:${providerId}`, userId);
  console.log(`🛒 Linked User ${userId} ↔ Provider ${providerId}`);
}

// ✅ Get provider for a user
export async function getProviderForUser(
  userId: string
): Promise<string | null> {
  return await redis.get(`order:${userId}`);
}

// ✅ Get user for a provider
export async function getUserForProvider(
  providerId: string
): Promise<string | null> {
  return await redis.get(`order:${providerId}`);
}
