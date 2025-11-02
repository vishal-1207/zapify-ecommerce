import db from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Notification service which creates a notification with a type, message which will be sent to a recipient using the link url mentioned.
 * @param {*} recipientId - Recipient for which the notification is being created.
 * @param {*} type - Type here denotes the category of notification such as orders, offers, etc.
 * @param {*} message - A custom text of message that is the relevant to the type of message being created.
 * @param {*} linkUrl - Link here denotes the route of the pages, the message is describing about, such as offer page, orders page, etc.
 * @returns
 */
export const createNotication = async (recipientId, type, message, linkUrl) => {
  try {
    const notification = await db.Notification.create({
      recipientId,
      type,
      message,
      linkUrl,
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification: ", error);
  }
};

/**
 * Service to get notifications related to user.
 * @param {*} userId - User id for which notifications will be fetched.
 * @returns
 */
export const getNotificationsForUser = async (userId) => {
  return db.Notification.findAndCountAll({
    where: { recipientId: userId },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });
};

/**
 * Notification service which marks notificaiton as read and also delete if settings is enabled for delete on read.
 * @param {*} user
 * @param {*} notificationIds
 * @returns
 */
export const markNotificationsAsRead = async (user, notificationIds) => {
  if (!notificationIds || notificationIds.length === 0) {
    throw new ApiError(400, "Notification IDs are required.");
  }

  const shouldDelete = user.settings?.deleteOnRead === true;

  if (shouldDelete) {
    await db.Notification.destroy({
      where: {
        id: notificationIds,
        recipientId: user.id,
      },
    });
    return { message: "Notifications deleted." };
  } else {
    await db.Notification.update(
      { isRead: true },
      { where: { id: notificationIds, recipientId: user.id } } // Security check
    );
    return { message: "Notifications marked as read." };
  }
};

/**
 * Notification service to clear all notifications regardless of it been read or not.
 * @param {*} userId
 * @returns
 */
export const clearAllNotifications = async (userId) => {
  await db.Notification.destroy({
    where: { recipientId: userId },
  });
  return { message: "All notifications have been cleared." };
};
