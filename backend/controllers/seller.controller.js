import * as orderService from "../services/order.service.js";
import * as sellerService from "../services/seller.service.js";
import * as offerService from "../services/offer.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * Get all orders for a seller (OrderItems)
 */
export const getSellerOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getSellerOrdersHistory(req.user.id, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Seller orders fetched successfully."));
});

/**
 * Update status of a specific order item
 */
export const updateSellerOrderItemStatus = asyncHandler(async (req, res) => {
  const { orderItemId } = req.params;
  const { status } = req.body;
  const result = await orderService.updateOrderItemStatus(req.user.id, orderItemId, status);
  return res.status(200).json(new ApiResponse(200, result, "Order item status updated successfully."));
});

/**
 * Creates a new store/seller profile for seller.
 */
export const createSellerProfile = asyncHandler(async (req, res) => {
  const { storeName, contactNumber, bio = null, website = null } = req.body;
  const userId = req.user.id;

  const data = { storeName, contactNumber, userId };
  const optional = { bio, website };
  const seller = await sellerService.createSellerProfile(data, optional);
  res
    .status(201)
    .json({ message: "Seller profile created successfully.", seller });
});

/**
 * Fetches seller profile detail.
 */
export const getSellerProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profile = await sellerService.getSellerProfile(userId);
  return res
    .status(200)
    .json({ message: "Seller profile fetched successfully.", profile });
});

/**
 * Update controller which allows seller to update their profile details.
 */
export const updateSellerProfile = asyncHandler(async (req, res) => {
  const { storeName, contactNumber, bio = null, website = null } = req.body;

  const slug = req.params.slug;

  const data = { storeName, contactNumber, slug };
  const optional = { bio, website };

  const updatedSeller = await sellerService.updateSellerProfile(data, optional);

  return res.status(201).json({
    message: "Seller profile updated successfully.",
    seller: updatedSeller,
  });
});

/**
 * Seller controller which deletes seller profile and data related to that seller.
 */
export const deleteSellerProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await sellerService.deleteSellerProfile(userId);
  return res.status(200).json({ message: result });
});

// Seller Dashboard Analytics Controllers
/**
 * Gets dashboard stats cards details for different sections of dashboard.
 */
export const getSellerDashboardStats = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const stats = await sellerService.getSellerDashboardStats(req.user.id, days);
  return res.status(200).json({ message: "Dashboard stats fetched.", stats });
});

/**
 * Gets sales data for graph, for the dashboard.
 */
export const getSellerSalesAnalytics = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const salesData = await sellerService.getSellerSalesAnalytics(
    req.user.id,
    days
  );
  return res
    .status(200)
    .json({ message: "Sales analytics fetched.", salesData });
});

/**
 * Gets top products list based on sales revenue.
 */
export const getSellerTopProducts = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const products = await sellerService.getSellerTopProducts(req.user.id, days);
  return res.status(200).json({ message: "Top products fetched.", products });
});

/**
 * Gets seller top performing products/offers categories.
 */
export const getSellerCategoryPerformance = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const categoryData = await sellerService.getSellerCategoryPerformance(
    req.user.id,
    days
  );
  return res
    .status(200)
    .json({ message: "Category performance fetched.", categoryData });
});

// Offer Management Controllers

/**
 * Get all offers for a seller
 */
/**
 * Get all offers for a seller
 */
export const getSellerOffers = asyncHandler(async (req, res) => {
  const result = await offerService.getSellerOffers(req.user.id, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Offers fetched successfully."));
});

/**
 * Update a seller offer
 */
export const updateSellerOffer = asyncHandler(async (req, res) => {
  const { offerId } = req.params;
  const updatedOffer = await offerService.updateOfferDetails(req.user.id, offerId, req.body);
  return res.status(200).json({ message: "Offer updated successfully.", offer: updatedOffer });
});

/**
 * Delete a seller offer
 */
// ... existing code ...
export const deleteSellerOffer = asyncHandler(async (req, res) => {
  const { offerId } = req.params;
  const result = await offerService.deleteProductOffer(req.user.id, offerId);
  return res.status(200).json(result);
});


