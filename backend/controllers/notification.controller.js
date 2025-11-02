import asyncHandler from "../utils/asyncHandler.js";
import * as notificationService from "../services/notification.service.js";

/**
 * Notification controller get current user in-app notifications.
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.getNotificationsForUser(
    req.user.id
  );
  return res
    .status(200)
    .json(new ApiResponse(200, notifications, "Notifications fetched."));
});

/**
 * Notification controller which lets user to mark a notification as read in-app.
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;

  const result = await notificationService.markNotificationsAsRead(
    req.user,
    notificationIds
  );
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * Notification controller to let users to clear or delete all in-app notifications regardless of it is read or not.
 */
export const clearAll = asyncHandler(async (req, res) => {
  const result = await notificationService.clearAllNotifications(req.user.id);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});
