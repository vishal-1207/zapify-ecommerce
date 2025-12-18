import * as sellerService from "../services/seller.service.js";
import asyncHandler from "../utils/asyncHandler.js";

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
