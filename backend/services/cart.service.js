import redisClient from "../config/redis.js";
import ApiError from "../utils/ApiError.js";
import db from "../models/index.js";
import { invalidateCache } from "../utils/cache.js";
import * as discountService from "../services/discount.service.js";

const getCartKey = (userId) => `cart:${userId}`;

/**
 * Gets a user's cart from Redis and enriches it with data from MySQL.
 * @param {*} userId
 * @returns
 */
export const getCart = async (userId) => {
  const cartKey = getCartKey(userId);
  const cartData = await redisClient.hGetAll(cartKey);

  if (Object.keys(cartData).length === 0)
    return {
      items: [],
      subtotal: 0,
      discount: 0,
      totalAmount: 0,
      appliedCoupon: null,
    };

  const items = [];
  let subtotal = 0;
  let appliedCoupon = null;

  for (const key in cartData) {
    if (key === "meta:coupon") {
      appliedCoupon = cartData[key];
      continue;
    }

    const item = JSON.parse(cartData[key]);

    const offerDetails = await db.Offer.findByPk(item.offerId, {
      include: [
        {
          model: db.Product,
          as: "product",
          attributes: ["id", "name"],
          include: [{ model: db.Media, as: "media" }],
        },
        {
          model: db.SellerProfile,
          as: "sellerProfile",
          attributes: ["id", "storeName"],
        },
      ],
    });

    if (offerDetails) {
      if (item.quantity > offerDetails.stockQuantity) {
        item.quantity = offerDetails.stockQuantity;
        item.error = `Quantity reduced. Only ${offerDetails.stockQuantity} available.`;
        if (offerDetails.stockQuantity === 0) {
          await removeItemFromCart(userId, item.offerId);
          continue;
        }

        await redisClient.hSet(
          getCartKey(userId),
          `offer:${item.offerId}`,
          JSON.stringify({ offerId: item.offerId, quantity: item.quantity })
        );
      }
      items.push({ ...item, details: offerDetails });
      subtotal += offerDetails.price * item.quantity;
    } else {
      await redisClient.hDel(getCartKey(userId), `offer:${item.offerId}`);
    }
  }

  let discountAmount = 0;
  let couponDetails = null;

  if (appliedCoupon) {
    try {
      const result = await discountService.validateAndCalculateDiscount(
        appliedCoupon,
        subtotal,
        userId
      );
      discountAmount = result.discountAmount;
      couponDetails = result;
    } catch (error) {
      await redisClient.hDel(cartKey, "meta:coupon");
      appliedCoupon = null;
    }
  }

  const totalAmount = Math.max(0, subtotal - discountAmount);

  return {
    items,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discountAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    appliedCoupon,
    couponDetails,
  };
};

/**
 * Adds a specific seller's offer to a user's cart in Redis.
 * This function will ADD to the existing quantity.
 * @param {string} userId
 * @param {string} offerId
 * @param {number} quantity
 * @returns
 */
export const addItemToCart = async (userId, offerId, quantity) => {
  const offer = await db.Offer.findByPk(offerId);

  if (!offer) throw new ApiError(404, "Offer not found.");

  if (offer.stockQuantity < quantity)
    throw new ApiError(400, "Not enough stock available.");

  const cartKey = getCartKey(userId);
  const itemKey = `offer:${offerId}`;

  const existingItemJSON = await redisClient.hGet(cartKey, itemKey);
  let newQuantity = quantity;

  if (existingItemJSON) {
    newQuantity += JSON.parse(existingItemJSON).quantity;
  }

  if (offer.stockQuantity < quantity) {
    throw new ApiError(
      400,
      "Total requested quantity exceeds available stock."
    );
  }

  const cartItem = { offerId, quantity: newQuantity };
  await redisClient.hSet(cartKey, itemKey, JSON.stringify(cartItem));
  await redisClient.expire(cartKey, 7 * 24 * 60 * 60);

  return getCartKey(userId);
};

/**
 * Updates the quantity of a specific item in the cart.
 * This function will SET the quantity.
 * @param {*} userId
 * @param {*} offerId
 * @param {*} quantity
 * @returns
 */
export const updateItemQuantity = async (userId, offerId, quantity) => {
  const newQuantity = parseInt(quantity, 10);

  if (isNaN(newQuantity) || newQuantity < 0) {
    throw new ApiError(400, "Invalid quantity provided.");
  }

  if (newQuantity === 0) {
    return removeItemFromCart(userId, offerId);
  }

  const offer = await db.Offer.findByPk(offerId);
  if (!offer) throw new ApiError(404, "Offer not found.");
  if (offer.stockQuantity < newQuantity) {
    throw new ApiError(
      400,
      `Not enough stock. Only ${offer.stockQuantity} items available.`
    );
  }

  const cartKey = getCartKey(userId);
  const itemKey = `offer:${offerId}`;

  const existingItemJSON = await redisClient.hGet(cartKey, itemKey);
  if (!existingItemJSON) {
    throw new ApiError(404, "Item not found in cart.");
  }

  const cartItem = { offerId, quantity: newQuantity };
  await redisClient.hSet(cartKey, itemKey, JSON.stringify(cartItem));

  return getCart(userId);
};

/**
 * Removes a single item from the cart.
 * @param {*} userId
 * @param {*} offerId
 * @returns
 */
export const removeItemFromCart = async (userId, offerId) => {
  const cartKey = getCartKey(userId);
  const itemKey = `offer:${offerId}`;

  const result = await redisClient.hDel(cartKey, itemKey);
  if (result === 0) {
    throw new ApiError(404, "Item not found in cart to remove.");
  }

  return getCart(userId);
};

/**
 * Deletes a user's entire cart from Redis.
 * @param {*} userId
 */
export const clearCart = async (userId) => {
  await invalidateCache(getCartKey(userId));
};

/**
 * Applies a discount coupon code to the Redis cart.
 */
export const applyCouponToCart = async (userId, code) => {
  const cartKey = getCartKey(userId);
  // Store the code in a special field 'meta:coupon'
  await redisClient.hSet(cartKey, "meta:coupon", code);
  return getCart(userId);
};

/**
 * Removes a discount coupon code from the Redis cart.
 */
export const removeCouponFromCart = async (userId) => {
  const cartKey = getCartKey(userId);
  await redisClient.hDel(cartKey, "meta:coupon");
  return getCart(userId);
};
