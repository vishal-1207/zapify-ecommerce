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
