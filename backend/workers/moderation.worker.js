import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisPort = parseInt(process.env.REDIS_PORT, 10) || 6379;
const isLocalhost =
  process.env.REDIS_HOST === "localhost" ||
  process.env.REDIS_HOST === "127.0.0.1";

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: redisPort,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  tls: !isLocalhost ? {} : undefined,
  maxRetriesPerRequest: null, // BullMQ recommendation
});

export const moderationQueue = new Queue("review-moderation", { connection });

let worker;

export const startModerationWorker = () => {
  worker = new Worker(
    "review-moderation",
    async (job) => {
      const { reviewId } = job.data;
      console.log(`[BullMQ] Processing moderation for review: ${reviewId}`);

      const { runModerationPipeline } =
        await import("../services/moderation.service.js");
      await runModerationPipeline(reviewId);

      return { success: true };
    },
    { connection },
  );

  worker.on("completed", (job) => {
    console.log(
      `[BullMQ] Moderation complete for review: ${job.data.reviewId}`,
    );
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[BullMQ] Moderation failed for review: ${job.data.reviewId}`,
      err.message,
    );
  });

  console.log("BullMQ Moderation Worker started.");
};

export const closeModerationWorker = async () => {
  if (worker) {
    await worker.close();
  }
};
