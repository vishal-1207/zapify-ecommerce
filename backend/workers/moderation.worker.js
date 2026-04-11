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

let worker = null;
let workerActive = false;

/**
 * Starts the moderation worker if it isn't already running.
 * The worker automatically shuts itself down once the queue is drained,
 * eliminating idle Redis polling on quiet days.
 */
const startWorkerIfNeeded = () => {
  if (workerActive) return;
  workerActive = true;


  worker = new Worker(
    "review-moderation",
    async (job) => {
      const { reviewId } = job.data;

      const { runModerationPipeline } =
        await import("../services/moderation.service.js");
      await runModerationPipeline(reviewId);

      return { success: true };
    },
    {
      connection,
      drainDelay: 30,
      stalledInterval: 5 * 60 * 1000,
    },
  );


  worker.on("failed", (job, err) => {
    console.error(
      `[BullMQ] Moderation failed for review: ${job.data.reviewId}`,
      err.message,
    );
  });

  worker.on("drain", async () => {
    workerActive = false;
    await worker.close();
    worker = null;
  });
};

/**
 * Enqueues a review-moderation job AND ensures the worker is running.
 * Use this instead of moderationQueue.add() directly everywhere reviews
 * need moderation — it applies the lazy-start logic automatically.
 *
 * @param {string} reviewId - The ID of the review to moderate.
 */
export const enqueueModeration = async (reviewId) => {
  await moderationQueue.add("moderate-review", { reviewId });
  startWorkerIfNeeded();
};

/**
 * Gracefully closes the worker if it is running.
 * Call this on process shutdown so in-flight jobs complete cleanly.
 */
export const closeModerationWorker = async () => {
  if (worker) {
    await worker.close();
    worker = null;
    workerActive = false;
  }
};

