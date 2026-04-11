import dotenv from "dotenv";
dotenv.config();
import { createClient } from "redis";

const redisPort = parseInt(process.env.REDIS_PORT, 10);

const isLocalhost =
  process.env.REDIS_HOST === "localhost" ||
  process.env.REDIS_HOST === "127.0.0.1";

const redisClient = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: redisPort,
    tls: !isLocalhost,
    connectTimeout: 5000,
  },
  disableOfflineQueue: true,
});

redisClient.on("error", (err) => {});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Failed to connect to Redis Cloud:", err);
  }
})();

export default redisClient;
