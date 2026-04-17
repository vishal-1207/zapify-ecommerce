import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { getSellerProfile } from "./seller.service.js";
import { updateProductAggregates } from "./product.service.js";
import { invalidateCache } from "../utils/cache.js";
import { Op } from "sequelize";

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

  await updateProductAggregates(productId);

  return offer;
};

/**
 * Fetches all of a seller's active offers.
 */
export const getActiveOffers = async (userId, status = "active") => {
  const seller = await getSellerProfile(userId);
  const offers = await db.Offer.findAll({
    where: { status, sellerProfileId: seller.id },
    include: [
      {
        model: db.Product,
        as: "product",
        attributes: ["id", "name", "price", "status", "minOfferPrice"],
      },
    ],
  });

  return offers;
};

/**
 * Service to get all offers for a seller with pagination and filtering.
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
        attributes: [
          "id",
          "name",
          "slug",
          "model",
          "brandId",
          "categoryId",
          "price",
          "minOfferPrice",
        ],
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
    include: [{ model: db.Product, as: "product" }],
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

  const resolvedProductId = offer.productId || offer.product?.id;
  if (resolvedProductId) {
    await updateProductAggregates(resolvedProductId);
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

  const activeOrders = await db.OrderItem.count({
    where: {
      offerId: offer.id,
      status: { [Op.in]: ["pending", "processed"] },
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

  if (productId) {
    await updateProductAggregates(productId);
  }

  return { message: "Offer successfully deleted." };
};
