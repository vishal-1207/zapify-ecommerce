import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { getSellerProfile } from "./seller.service.js";

/**
 * Helper to recalculate and update product stats (minPrice, totalStock, offerCount).
 * This updates the Product record, triggering the afterUpdate hook which syncs to Algolia.
 */
const updateProductStats = async (productId) => {
  const offers = await db.Offer.findAll({
    where: { productId, status: "active" },
    attributes: ["price", "stockQuantity"],
  });

  const offerCount = offers.length;
  const totalOfferStock = offers.reduce((sum, o) => sum + o.stockQuantity, 0);

  // Find minimum price among active offers with stock > 0 (preferred) or just active offers
  // Usually min price is lowest price regardless of stock, OR lowest in-stock price.
  // Amazon shows lowest price. Let's do lowest price.
  // Actually, if stock is 0, it shouldn't be the "price".
  // Let's filter for in-stock offers first?
  const inStockOffers = offers.filter((o) => o.stockQuantity > 0);
  const candidates = inStockOffers.length > 0 ? inStockOffers : offers;

  let minOfferPrice = 0;
  if (candidates.length > 0) {
    minOfferPrice = Math.min(...candidates.map((o) => parseFloat(o.price)));
  } else {
    // If no active offers, maybe keep old price or 0?
    // If 0, it might look like "Free". Let's keep it 0 or null?
    // Check if product has a base price? Product table has 'price'.
    // But minOfferPrice is specific.
    minOfferPrice = 0;
  }

  await db.Product.update(
    {
      minOfferPrice: minOfferPrice > 0 ? minOfferPrice : null, // If 0, set null or let it be 0? Model allows null.
      totalOfferStock,
      offerCount,
    },
    { where: { id: productId } },
  );

  // We also need to invalidate cache explicitly because the hook might not handle Redis cache invalidation
  // (The hook handles Algolia).
  const product = await db.Product.findByPk(productId, {
    attributes: ["slug"],
  });
  if (product) {
    await invalidateCache(`product:${product.slug}`);
  }
};

/**
 * Service for a seller to create an offer for an existing, approved product.
 * @param {string} productId - The ID of the generic product.
 * @param {string} sellerProfileId - The ID of the seller creating the offer.
 * @param {object} offerData - Data for the offer { price, stockQuantity, condition }.
 * @returns {Promise<Offer>} The newly created offer.
 */
export const createOfferForProduct = async (
  productId,
  sellerProfileId,
  offerData,
) => {
  const product = await db.Product.findOne({
    where: {
      id: productId,
      status: "approved",
    },
  });

  if (!product) {
    throw new ApiError(404, "Approved product not found in catalog.");
  }

  const existingOffer = await db.Offer.findOne({
    where: { productId, sellerProfileId },
  });

  if (existingOffer) {
    throw new ApiError(
      409,
      "You already have an offer for this product. Please update it instead.",
    );
  }

  const offer = await db.Offer.create({
    ...offerData,
    status: offerData.status || "active",
    productId,
    sellerProfileId,
  });

  if (!offer) {
    throw new ApiError(500, "Something went wrong.");
  }

  // Update Stats
  await updateProductStats(productId);

  return offer;
};

/**
 * Fetches all of a seller's active offers.
 */
export const getActiveOffers = async (userId, status = "active") => {
  // ... existing code ...
  const seller = getSellerProfile(userId);
  const offers = await db.Offer.findAll({
    where: { status, sellerProfileId: seller.id },
    include: [
      {
        model: db.Product,
        as: "product",
        attributes: ["id", "name", "price", "status"],
      },
    ],
  });

  return offers;
};

/**
 * Fetches all of a seller's offers (their inventory).
 * @param {*} userId
 * @returns
 */
import { Op } from "sequelize"; // Ensure Op is imported

/**
 * Service to get all offers for a seller with pagination and filtering.
 * Replaces simple getAllOffers.
 * @param {string} userId
 * @param {object} query - { page, limit, status, search }
 */
export const getSellerOffers = async (userId, query) => {
  const profile = await getSellerProfile(userId);
  const { page = 1, limit = 10, status, search } = query || {};
  const offset = (page - 1) * limit;

  const whereClause = { sellerProfileId: profile.id };
  if (status) {
    whereClause.status = status;
  }

  const productWhere = {};
  if (search) {
    productWhere.name = { [Op.iLike]: `%${search}%` };
  }

  const { count, rows } = await db.Offer.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: db.Product,
        as: "product",
        where: productWhere,
        attributes: ["id", "name", "slug", "model", "brandId", "categoryId"],
        include: [
          {
            model: db.Category,
            as: "category",
            attributes: ["name"],
          },
          {
            model: db.Media,
            as: "media",
            attributes: ["url"],
            where: { tag: "thumbnail" },
            required: false,
          },
        ],
      },
    ],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [["createdAt", "DESC"]],
    distinct: true,
  });

  return {
    offers: rows,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page, 10),
    totalItems: count,
  };
};

import { invalidateCache } from "../utils/cache.js";
import { syncProductToAlgolia } from "./algolia.service.js";

/**
 * Service for a seller to update their own offer (price, stock, condition, status).
 * @param {string} userId - The ID of the seller (user).
 * @param {string} offerId - The ID of the offer to update.
 * @param {object} updateData - The new data for the offer.
 * @returns {Promise<Offer>} The updated offer object.
 */
export const updateOfferDetails = async (userId, offerId, updateData) => {
  const profile = await getSellerProfile(userId);
  const offer = await db.Offer.findOne({
    where: { id: offerId, sellerProfileId: profile.id },
    include: [{ model: db.Product, as: "product" }], // Include product to get slug/id
  });
  if (!offer) {
    throw new ApiError(
      404,
      "Offer not found or you do not have permission to edit it.",
    );
  }

  const {
    price,
    stockQuantity,
    condition,
    status,
    dealPrice,
    dealStartDate,
    dealEndDate,
  } = updateData;
  if (price !== undefined) offer.price = price;
  if (stockQuantity !== undefined) offer.stockQuantity = stockQuantity;
  if (condition !== undefined) offer.condition = condition;
  if (status !== undefined) offer.status = status;

  if (dealPrice !== undefined) offer.dealPrice = dealPrice;
  if (dealStartDate !== undefined) offer.dealStartDate = dealStartDate;
  if (dealEndDate !== undefined) offer.dealEndDate = dealEndDate;

  await offer.save();

  // Update Product Stats (Trigger Sync & Invalidation)
  if (offer.productId) {
    await updateProductStats(offer.productId);
  } else if (offer.product && offer.product.id) {
    await updateProductStats(offer.product.id);
  }

  return offer;
};

/**
 * Service for a seller to delete their own offer.
 * Includes check for pending orders.
 * @param {string} userId - The ID of the seller (user).
 * @param {string} offerId - The ID of the offer to delete.
 * @returns {object} A success message.
 */
export const deleteProductOffer = async (userId, offerId) => {
  const profile = await getSellerProfile(userId);
  const offer = await db.Offer.findOne({
    where: { id: offerId, sellerProfileId: profile.id },
    include: [{ model: db.Product, as: "product" }],
  });
  if (!offer) {
    throw new ApiError(
      404,
      "Offer not found or you do not have permission to delete it.",
    );
  }

  // Check for pending orders before deleting
  const activeOrders = await db.OrderItem.count({
    where: {
      offerId: offer.id,
      status: { [Op.in]: ["pending", "processing"] },
    },
  });

  if (activeOrders > 0) {
    throw new ApiError(
      400,
      "Cannot delete offer with active/pending orders. Please deactivate it instead.",
    );
  }

  const productId = offer.product?.id || offer.productId;

  await offer.destroy();

  // Update Product Stats
  if (productId) {
    await updateProductStats(productId);
  }

  return { message: "Offer successfully deleted." };
};
