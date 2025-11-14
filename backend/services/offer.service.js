import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { getSellerProfile } from "./seller.service.js";

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
  offerData
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
      "You already have an offer for this product. Please update it instead."
    );
  }

  const offer = await db.Offer.create({
    ...offerData,
    productId,
    sellerProfileId,
  });

  if (!offer) {
    throw new ApiError(500, "Something went wrong.");
  }

  return offer;
};

/**
 * Fetches all of a seller's active offers.
 */
export const getActiveOffers = async (userId, status = "active") => {
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
export const getAllOffers = async (userId) => {
  const profile = await getSellerProfile(userId);
  return db.Offer.findAll({
    where: { sellerProfileId: profile.id },
    include: [
      {
        model: db.Product,
        as: "product",
        attributes: ["id", "name", "price", "status"],
      },
    ],
  });
};

/**
 * Service to get the details of a single offer, ensuring it belongs to the requesting seller.
 * @param {string} offerId - The ID of the offer to retrieve.
 * @param {string} sellerProfileId - The ID of the seller making the request.
 * @returns {Promise<Offer>} The detailed offer object.
 */
export const getOfferDetails = async (offerId, sellerProfileId) => {
  const offer = await db.Offer.findOne({
    where: { id: offerId, sellerProfileId },
    include: [{ model: db.Product, as: "product", attributes: ["id", "name"] }],
  });

  if (!offer) {
    throw new ApiError(
      404,
      "Offer not found or you do not have permission to view it."
    );
  }
  return offer;
};

/**
 * Service for a seller to update their own offer (price, stock, condition).
 * @param {string} offerId - The ID of the offer to update.
 * @param {string} sellerProfileId - The ID of the seller making the request.
 * @param {object} updateData - The new data for the offer.
 * @returns {Promise<Offer>} The updated offer object.
 */
export const updateOfferDetails = async (
  offerId,
  sellerProfileId,
  updateData
) => {
  const offer = await db.Offer.findOne({
    where: { id: offerId, sellerProfileId },
  });
  if (!offer) {
    throw new ApiError(
      404,
      "Offer not found or you do not have permission to edit it."
    );
  }

  const { price, stockQuantity, condition } = updateData;
  if (price !== undefined) offer.price = price;
  if (stockQuantity !== undefined) offer.stockQuantity = stockQuantity;
  if (condition !== undefined) offer.condition = condition;

  await offer.save();
  return offer;
};

/**
 * Service for a seller to delete their own offer.
 * @param {string} offerId - The ID of the offer to delete.
 * @param {string} sellerProfileId - The ID of the seller making the request.
 * @returns {object} A success message.
 */
export const deleteProductOffer = async (offerId, sellerProfileId) => {
  const offer = await db.Offer.findOne({
    where: { id: offerId, sellerProfileId },
  });
  if (!offer) {
    throw new ApiError(
      404,
      "Offer not found or you do not have permission to delete it."
    );
  }
  await offer.destroy();
  return { message: "Offer successfully deleted." };
};
