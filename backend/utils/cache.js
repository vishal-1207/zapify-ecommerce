import redisClient from "../config/redis.js";

/**
 * Retrieves data from the Redis cache.
 * Automatically parses the JSON string back into an object.
 * @param {string} key - The cache key.
 * @returns {Promise<any|null>} The parsed data or null if not found.
 */
export const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error(`Redis Get Error for key ${key}: `, error);

    // Return null so the application can fall back to the database
    // instead of crashing if Redis is down.
    return null;
  }
};

/**
 * Saves data to the Redis cache with an expiration time.
 * Automatically stringifies the object before saving.
 * @param {string} key - The cache key.
 * @param {any} data - The data to cache.
 * @param {number} ttlSeconds - Time-to-live in seconds (default: 1 hour).
 */
export const setCache = async (key, data, ttlSeconds) => {
  try {
    const stringifiedData = JSON.stringify(data);
    await redisClient.setEx(key, parseInt(ttlSeconds), stringifiedData);
  } catch (error) {
    console.error(`Redis Set Error for key ${key}: `, error);
  }
};

/**
 * Removes a specific key from the cache (invalidation).
 * @param {string} key - The cache key to delete.
 */
export const invalidateCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error(`Redis Delete Error for key ${key}: `, error);
  }
};
