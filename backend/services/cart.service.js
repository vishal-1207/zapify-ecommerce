import redisClient from "../config/redis.js";
import ApiError from "../utils/ApiError.js";
import db from "../models/index.js";
import { invalidateCache } from "../utils/cache.js";
import * as discountService from "../services/discount.service.js";

const getCartKey = (userId) => `cart:${userId}`;
const CART_TTL = 7 * 24 * 60 * 60;

/**
 * Gets a user's cart from Redis and enriches it with data from MySQL.
 * @param {*} userId
 * @returns
 */
export const getCart = async (userId) => {
  const cartKey = getCartKey(userId);
  const cartData = await redisClient.hGetAll(cartKey);

  if (!cartData || Object.keys(cartData).length === 0) {
    return {
      items: [],
      subtotal: 0,
      discount: 0,
      totalAmount: 0,
      appliedCoupon: null,
    };
  }

  const redisItems = [];
  let appliedCoupon = cartData["meta:coupon"] || null;

  for (const [key, value] of Object.entries(cartData)) {
    if (key === "meta:coupon") continue;
    redisItems.push(JSON.parse(value));
  }

  const offerIds = redisItems.map((item) => item.offerId);

  const offerDetails = await db.Offer.findAll({
    where: { id: offerIds },
    attributes: ["id", "price", "stockQuantity", "condition"],
    include: [
      {
        model: db.Product,
        as: "product",
        attributes: ["id", "name", "slug"],
        include: [
          {
            model: db.Media,
            as: "media",
            attributes: ["url"],
            where: { tag: "thumbnail" },
            required: false,
          },
        ],
      },
      {
        model: db.SellerProfile,
        as: "sellerProfile",
        attributes: ["id", "storeName"],
      },
    ],
  });

  const items = [];
  let subtotal = 0;
  const updates = [];

  for (const redisItem of redisItems) {
    const detail = offerDetails.find((d) => d.id === redisItem.offerId);

    if (!detail) {
      updates.push(redisClient.hDel(cartKey, `offer:${redisItem.offerId}`));
      continue;
    }

    let finalQty = redisItem.quantity;
    let error = null;

    if (detail.stockQuantity <= 0) {
      updates.push(redisClient.hDel(cartKey, `offer:${redisItem.offerId}`));
      continue;
    }

    if (finalQty > detail.stockQuantity) {
      finalQty = detail.stockQuantity;
      error = `Only ${detail.stockQuantity} units left in stock.`;
      updates.push(
        redisClient.hSet(
          cartKey,
          `offer:${detail.id}`,
          JSON.stringify({ offerId: detail.id, quantity: finalQty })
        )
      );
    }

    items.push({
      offerId: detail.id,
      quantity: finalQty,
      error,
      details: detail,
    });

    subtotal += parseFloat(detail.price) * finalQty;
  }

  if (updates.length > 0) Promise.all(updates).catch(() => null);

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

  return {
    items,
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discountAmount.toFixed(2)),
    totalAmount: Number(Math.max(0, subtotal - discountAmount).toFixed(2)),
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
  let offer = await db.Offer.findByPk(offerId);

  // If offer not found, check if offerId is actually a productId
  if (!offer) {
    const product = await db.Product.findByPk(offerId);
    if (product) {
      // Find the cheapest offer for this product
      const cheapestOffer = await db.Offer.findOne({
        where: { 
          productId: product.id,
          stockQuantity: { [db.Sequelize.Op.gt]: 0 }
        },
        order: [['price', 'ASC']],
      });
      
      if (!cheapestOffer) {
        throw new ApiError(404, "No available offers found for this product.");
      }
      
      offer = cheapestOffer;
      offerId = cheapestOffer.id; // Update offerId to the actual offer ID
    } else {
      throw new ApiError(404, "Offer not found.");
    }
  }

  const cartKey = getCartKey(userId);
  const itemKey = `offer:${offerId}`;

  const existingItemJSON = await redisClient.hGet(cartKey, itemKey);
  const currentQty = existingItemJSON
    ? JSON.parse(existingItemJSON).quantity
    : 0;
  const newTotalQty = currentQty + quantity;

  if (offer.stockQuantity < newTotalQty) {
    throw new ApiError(
      400,
      `Cannot add more. Total in cart (${newTotalQty}) exceeds stock.`
    );
  }

  const cartItem = { offerId, quantity: newTotalQty };
  await redisClient.hSet(cartKey, itemKey, JSON.stringify(cartItem));
  await redisClient.expire(cartKey, CART_TTL);

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
  if (quantity <= 0) return removeItemFromCart(userId, offerId);

  const offer = await db.Offer.findByPk(offerId, {
    attributes: ["id", "stockQuantity"],
  });
  if (!offer) throw new ApiError(404, "Offer not found.");
  if (offer.stockQuantity < quantity)
    throw new ApiError(400, "Insufficient stock.");

  const cartKey = getCartKey(userId);
  const itemKey = `offer:${offerId}`;

  const existingItemJSON = await redisClient.hGet(cartKey, itemKey);
  if (!existingItemJSON) {
    throw new ApiError(404, "Item not found in cart.");
  }

  const cartItem = { offerId, quantity };
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
  await redisClient.hDel(cartKey, itemKey);
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
