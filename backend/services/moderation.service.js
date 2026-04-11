/**
 * Moderation Service
 *
 * Provides an automated content moderation pipeline for reviews.
 * The NSFW ML model is loaded ONCE at first use (lazy singleton)
 * to avoid re-loading on every review and to prevent blocking server startup.
 *
 * Pipeline steps:
 *   1. Profanity check  — leo-profanity (sync, dictionary-based)
 *   2. Spam check       — heuristics (length, caps, URLs, repetition)
 *   3. Velocity check   — Redis counters per userId
 *   4. Duplicate check  — DB query (same comment, same user, multiple products)
 *   5. Toxicity check   — Sentiment analysis (offline AFINN lexicon)
 *   6. NSFW image check — nsfwjs + sharp (offline TF.js model)
 *   7. Scoring + decision → update review status
 */

import redisClient from "../config/redis.js";
import db from "../models/index.js";
import fs from "fs/promises";
import { Op } from "sequelize";
import { createRequire } from "module";
import Sentiment from "sentiment";

const require = createRequire(import.meta.url);
const sentimentAnalyzer = new Sentiment();

let _nsfwModel = null;

async function getNsfwModel() {
  if (!_nsfwModel) {
    const tf = await import("@tensorflow/tfjs-node");
    const nsfwjs = require("nsfwjs");

    // Help TFJS optimize for memory
    if (tf.engine().backendName === "cpu") {
    }

    _nsfwModel = await nsfwjs.load();
  }
  return _nsfwModel;
}

/**
 * Checks comment for profanity using the leo-profanity dictionary.
 * @returns {{ found: boolean, words: string[] }}
 */
async function checkProfanity(comment) {
  if (!comment) return { found: false, words: [] };
  const { default: leoProfanity } = await import("leo-profanity");
  leoProfanity.loadDictionary(); // loads English dictionary
  const hasProfanity = leoProfanity.check(comment);
  const words = hasProfanity
    ? comment.split(/\s+/).filter((w) => leoProfanity.check(w))
    : [];
  return { found: hasProfanity, words };
}

/**
 * Rule-based spam detection on comment text.
 * @returns {{ isSpam: boolean, reasons: string[] }}
 */
function checkSpam(comment) {
  if (!comment || comment.trim().length === 0) {
    return { isSpam: false, reasons: [] };
  }

  const reasons = [];
  const words = comment.trim().split(/\s+/);

  if (words.length <= 1) {
    reasons.push("too_short");
  }

  const alphChars = comment.replace(/[^a-zA-Z]/g, "");
  if (alphChars.length > 5) {
    const upperRatio = comment.replace(/[^A-Z]/g, "").length / alphChars.length;
    if (upperRatio > 0.7) reasons.push("excessive_caps");
  }

  if (/(.)\1{5,}/.test(comment)) reasons.push("repeated_chars");

  const urlMatches = comment.match(/https?:\/\/[^\s]+/g) || [];
  if (urlMatches.length > 2) reasons.push("excessive_urls");

  const wordFreq = {};
  words.forEach((w) => {
    const lower = w.toLowerCase().replace(/[^a-z]/g, "");
    if (lower.length > 2) wordFreq[lower] = (wordFreq[lower] || 0) + 1;
  });
  const maxRepeat = Math.max(0, ...Object.values(wordFreq));
  if (maxRepeat > 5) reasons.push("word_stuffing");

  return { isSpam: reasons.length > 0, reasons };
}

/**
 * Checks how many reviews a user has submitted recently.
 * Uses Redis INCR + EXPIRE to implement sliding windows.
 * @returns {{ suspicious: boolean, hourCount: number, dayCount: number }}
 */
async function checkVelocity(userId) {
  try {
    const hourKey = `rev:hour:${userId}`;
    const dayKey = `rev:day:${userId}`;

    const [hourCount, dayCount] = await Promise.all([
      redisClient.incr(hourKey),
      redisClient.incr(dayKey),
    ]);

    if (hourCount === 1) await redisClient.expire(hourKey, 3600);
    if (dayCount === 1) await redisClient.expire(dayKey, 86400);

    const suspicious = hourCount > 3 || dayCount > 10;
    return { suspicious, hourCount, dayCount };
  } catch (err) {
    console.error("[Moderation] Redis velocity check failed:", err.message);
    return { suspicious: false, hourCount: 0, dayCount: 0 };
  }
}

/**
 * Detects if the same user has submitted the exact same comment
 * across 2 or more different products (copy-paste spamming).
 * @returns {{ isDuplicate: boolean }}
 */
async function checkDuplicateComment(comment, userId) {
  if (!comment || comment.trim().length < 10) return { isDuplicate: false };
  try {
    const count = await db.Review.count({
      where: { comment: comment.trim(), userId },
    });
    return { isDuplicate: count >= 2 };
  } catch (err) {
    console.error("[Moderation] Duplicate check failed:", err.message);
    return { isDuplicate: false };
  }
}

/**
 * Runs a dictionary-based AFINN Sentiment Analysis on the comment text.
 * Extracts highly negative sentiment elements as "toxic" categories.
 * @returns {{ isToxic: boolean, score: number, categories: string[] }}
 */
async function checkTextToxicity(comment) {
  if (!comment || comment.trim().length < 5) {
    return { isToxic: false, score: 0, categories: [] };
  }
  try {
    const result = sentimentAnalyzer.analyze(comment);

    const isToxic = result.score <= -3;

    const normalizedScore = isToxic
      ? Math.min(Math.abs(result.score) / 10, 1.0)
      : 0;

    return {
      isToxic,
      score: parseFloat(normalizedScore.toFixed(2)),
      categories: isToxic ? result.negative : [],
    };
  } catch (err) {
    console.error("[Moderation] Sentiment toxicity check failed:", err.message);
    return { isToxic: false, score: 0, categories: [] };
  }
}

/**
 * Downloads each review image from its Cloudinary URL and runs the nsfwjs
 * classifier on it. Returns true if ANY image scores above the NSFW threshold.
 * @param {string[]} mediaUrls - Array of image URLs from Cloudinary
 * @returns {{ isNsfw: boolean, scores: object[] }}
 */
async function checkNsfwMedia(mediaUrls) {
  if (!mediaUrls || mediaUrls.length === 0) {
    return { isNsfw: false, scores: [] };
  }

  try {
    const [tf, sharp, nsfwModel] = await Promise.all([
      import("@tensorflow/tfjs-node"),
      import("sharp"),
      getNsfwModel(),
    ]);

    const scores = [];
    for (const url of mediaUrls) {
      tf.default.engine().startScope();
      let tensor = null;
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const arrayBuffer = await response.arrayBuffer();
        const rawBuffer = Buffer.from(arrayBuffer);

        const processedBuffer = await sharp
          .default(rawBuffer)
          .resize(224, 224)
          .toFormat("png")
          .toBuffer();

        tensor = tf.default.node.decodeImage(processedBuffer, 3);
        const predictions = await nsfwModel.classify(tensor);

        const nsfwScore = predictions
          .filter((p) => ["Porn", "Hentai", "Sexy"].includes(p.className))
          .reduce((sum, p) => sum + p.probability, 0);

        scores.push({ url, nsfwScore: parseFloat(nsfwScore.toFixed(3)) });
      } catch (imgErr) {
        console.error(
          "[Moderation] NSFW check failed for image:",
          url,
          imgErr.message,
        );
      } finally {
        if (tensor) tensor.dispose();
        tf.default.engine().endScope();
      }
    }

    const isNsfw = scores.some((s) => s.nsfwScore > 0.6);
    return { isNsfw, scores };
  } catch (err) {
    console.error("[Moderation] NSFW module load failed:", err.message);
    return { isNsfw: false, scores: [] };
  }
}

/**
 * Runs the nsfwjs classifier on LOCAL multer files before upload.
 * @param {object[]} files - Array of multer file objects
 * @returns {{ isNsfw: boolean, scores: object[] }}
 */
export async function checkLocalNsfwMedia(files) {
  if (!files || files.length === 0) {
    return { isNsfw: false, scores: [] };
  }

  try {
    const tf = await import("@tensorflow/tfjs-node");
    const sharp = await import("sharp");
    const nsfwModel = await getNsfwModel();

    if (!nsfwModel) {
      console.warn(
        "[Moderation] NSFW model not initialized, skipping local check.",
      );
      return { isNsfw: false, scores: [] };
    }

    const scores = [];
    for (const file of files) {
      if (!file.mimetype.startsWith("image/")) continue;
      tf.default.engine().startScope();
      let tensor = null;
      try {
        const rawBuffer = await fs.readFile(file.path);

        const processedBuffer = await sharp
          .default(rawBuffer)
          .resize(224, 224)
          .toFormat("png")
          .toBuffer();

        tensor = tf.default.node.decodeImage(processedBuffer, 3);
        const predictions = await nsfwModel.classify(tensor);

        const nsfwScore = predictions
          .filter((p) => ["Porn", "Hentai", "Sexy"].includes(p.className))
          .reduce((sum, p) => sum + p.probability, 0);

        scores.push({
          filename: file.originalname,
          nsfwScore: parseFloat(nsfwScore.toFixed(3)),
        });
      } catch (imgErr) {
        console.error(
          "[Moderation] NSFW check failed for local image:",
          file.path,
          imgErr.message,
        );
      } finally {
        if (tensor) tensor.dispose();
        tf.default.engine().endScope();
      }
    }

    const isNsfw = scores.some((s) => s.nsfwScore > 0.6);
    return { isNsfw, scores };
  } catch (err) {
    console.error("[Moderation] Local NSFW module load failed:", err.message);
    return { isNsfw: false, scores: [] };
  }
}

/**
 * Computes a composite autoModScore (0–1) from all check results
 * and decides the final automated status.
 *
 * Decision rules (priority order):
 *   - NSFW image detected  → auto-reject (hard block)
 *   - score >= 0.7          → auto-reject
 *   - score >= 0.3          → flag for review
 *   - score < 0.3           → pending manual review (safe but unverified)
 *
 * @param {object} flags - The autoModFlags object
 * @returns {{ score: number, status: string }}
 */
function computeDecision(flags) {
  if (flags.nsfw) return { score: 1.0, status: "rejected" };

  let score = 0;
  if (flags.profanity) score += 0.5;
  if (flags.spam) score += 0.4;
  if (flags.suspicious) score += 0.3;
  score += flags.toxicity * 0.8;

  score = Math.min(score, 1.0);

  let status = "pending"; // Default to pending for clean reviews
  if (score >= 0.7) status = "rejected";
  else if (score >= 0.3) status = "flagged";

  return { score: parseFloat(score.toFixed(2)), status };
}

/**
 * Runs the full moderation pipeline for a review.
 * Safe to call fire-and-forget (errors are caught internally).
 * @param {string} reviewId
 */
export async function runModerationPipeline(reviewId) {
  const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
  try {
    const review = await db.Review.findByPk(reviewId, {
      include: [{ model: db.Media, as: "media" }],
    });

    if (!review) {
      console.warn(`[Moderation] Review ${reviewId} not found — skipping.`);
      return;
    }

    const comment = review.comment || "";
    const userId = review.userId;
    const imageUrls = (review.media || [])
      .filter((m) => m.fileType === "image")
      .map((m) => m.url);

    const [
      profanityResult,
      toxicityResult,
      nsfwResult,
      velocityResult,
      dupResult,
    ] = await Promise.all([
      checkProfanity(comment),
      checkTextToxicity(comment),
      checkNsfwMedia(imageUrls),
      checkVelocity(userId),
      checkDuplicateComment(comment, userId),
    ]);

    const spamResult = checkSpam(comment);

    const suspicious =
      velocityResult.suspicious ||
      dupResult.isDuplicate ||
      spamResult.reasons.includes("word_stuffing");

    const autoModFlags = {
      profanity: profanityResult.found,
      spam: spamResult.isSpam,
      suspicious,
      toxicity: toxicityResult.score,
      nsfw: nsfwResult.isNsfw,
      spamReasons: spamResult.reasons,
      toxicityCategories: toxicityResult.categories,
    };

    const { score, status } = computeDecision(autoModFlags);

    const reasons = [];
    if (autoModFlags.profanity) reasons.push("profanity detected");
    if (autoModFlags.nsfw) reasons.push("inappropriate image content");
    if (autoModFlags.spam)
      reasons.push(
        `spam indicators (${spamResult.reasons.join(", ").replace("_", " ")})`,
      );
    if (autoModFlags.suspicious) reasons.push("suspicious submission pattern");
    if (autoModFlags.toxicity > 0)
      reasons.push(`toxic content (${toxicityResult.categories.join(", ")})`);

    const moderationReason =
      reasons.length > 0 ? `Automated: ${reasons.join("; ")}.` : null;

    await review.update({
      status,
      autoModScore: score,
      autoModFlags,
      moderationReason,
    });

    if (status === "approved") {
      const { updateProductAverageRating, updateSellerAverageRating } =
        await import("./reviews.service.js");
      updateProductAverageRating(review.productId).catch(() => {});
      const orderItem = await db.OrderItem.findByPk(review.orderItemId, {
        include: [{ model: db.Offer, attributes: ["sellerProfileId"] }],
      });
      if (orderItem?.Offer?.sellerProfileId) {
        updateSellerAverageRating(orderItem.Offer.sellerProfileId).catch(
          () => {},
        );
      }
    }

    const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
  } catch (err) {
    // Prediction complete
  }
}
