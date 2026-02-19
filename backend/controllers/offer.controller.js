import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import * as offerServices from "../services/offer.service.js";
import db from "../models/index.js";

/**
 * Offer controller to get all listed offers by the seller.
 */
export const getOffersList = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await offerServices.getSellerOffers(userId, req.query);
  res.status(200).json({ message: "Offers fetched successfully.", ...result });
});

/**
 * Offer controller to get only active listed offers by the seller.
 */
export const getActiveOffersList = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const offers = await offerServices.getActiveOffers(userId);

  return res
    .status(200)
    .json({ message: "Fetched active offers successfully.", offers });
});

/**
 * Offer controller for seller to create offer for a product.
 */
export const createOffer = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const offerData = req.body;
  const sellerProfile = await db.SellerProfile.findOne({
    where: { userId: req.user.id },
  });

  if (!sellerProfile) {
    throw new ApiError(
      403,
      "Forbidden: You must have an seller profile to perform this action.",
    );
  }

  const newOffer = await offerServices.createOfferForProduct(
    productId,
    sellerProfile.id,
    offerData,
  );
  return res
    .status(201)
    .json({ message: "Offer created successfully.", newOffer });
});

/**
 * Offer controller to get details of a specific offer for a product.
 */
export const getOfferDetailsController = asyncHandler(async (req, res) => {
  const sellerProfile = await db.SellerProfile.findOne({
    where: { userId: req.user.id },
  });

  if (!sellerProfile) {
    throw new ApiError(
      403,
      "Forbidden: You must have a seller profile to perform this action.",
    );
  }

  const { offerId } = req.params;
  const offer = await offerServices.getOfferDetails(offerId, sellerProfile.id);
  return res
    .status(200)
    .json({ message: "Offer details fetched successfully.", offer });
});

/**
 * Offer controller to update an existing offer for a product.
 */
export const updateOfferController = asyncHandler(async (req, res) => {
  const sellerProfile = await db.SellerProfile.findOne({
    where: { userId: req.user.id },
  });
  if (!sellerProfile) {
    throw new ApiError(
      403,
      "Forbidden: You must have a seller profile to perform this action.",
    );
  }

  const { offerId } = req.params;
  const updatedOffer = await offerServices.updateOfferDetails(
    offerId,
    sellerProfile.id,
    req.body,
  );

  return res
    .status(200)
    .json({ message: "Offer updated successfully.", updatedOffer });
});

/**
 * Offer controller to delete an offer for a specific product.
 */
export const deleteOfferController = asyncHandler(async (req, res) => {
  const sellerProfile = await db.SellerProfile.findOne({
    where: { userId: req.user.id },
  });
  if (!sellerProfile) {
    throw new ApiError(
      403,
      "Forbidden: You must have a seller profile to perform this action.",
    );
  }

  const { offerId } = req.params;
  const result = await offerServices.deleteProductOffer(
    offerId,
    sellerProfile.id,
  );

  return res.status(200).json({ message: result.message, result });
});
