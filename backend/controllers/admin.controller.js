import db from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as adminService from "../services/admin.service.js";

/**
 * Admin dashboard controller to get high level KPI stats for cards
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getAdminDashboardStats();
  return res.status(200).json({ message: "Admin stats fetched.", stats });
});

/**
 * Get platform-wide sales data grouped by day for a line chart.
 */
export const getSalesOverTime = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const salesData = await adminService.getPlatformSalesOverTime(days);
  return res.status(200).json({ message: "Sales data fetched.", salesData });
});

/**
 * Get platform-wide sales data grouped by category for a pie chart.
 */
export const getSalesByCategory = asyncHandler(async (req, res) => {
  const categoryData = await adminService.getPlatformSalesByCategory();
  return res
    .status(200)
    .json({ message: "Category sales data fetched.", categoryData });
});

/**
 * Get user and seller signup data grouped by day for a line chart.
 */
export const getSignupAnalytics = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const signupData = await adminService.getSignupAnalytics(days);
  return res
    .status(200)
    .json({ message: "Signup analytics fetched.", signupData });
});

/**
 * Get order activity (delivered, processing, cancelled) grouped by day.
 */
export const getOrderActivityAnalytics = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const orderData = await adminService.getOrderActivityAnalytics(days);
  return res
    .status(200)
    .json({ message: "Order activity fetched.", orderData });
});

/**
 * Admin controller to get list of all user's (customer or seller), which can be used for auditing or other uses.
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const result = await adminService.getUsersList(role, page, limit);

  if (result.total === 0) {
    return res.status(200).json({
      message: "No users found.",
    });
  }

  return res.status(200).json({
    message: `Found ${result.total} product(s) pending for review.`,
    ...result,
  });
});

/**
 * Update user status (block/unblock)
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body; // expect enum like 'active', 'blocked'

  const user = await adminService.updateUserStatusService(userId, status);

  return res.status(200).json({
    message: `User status updated to ${status}.`,
    user,
  });
});

/**
 * Soft delete a user
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  await adminService.deleteUserService(userId);
  return res.status(200).json({ message: "User deleted successfully." });
});

/**
 * Get all orders for admin
 */
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const result = await adminService.getAllOrdersService(page, limit, status);

  return res.status(200).json({
    message: "All orders fetched.",
    ...result,
  });
});
