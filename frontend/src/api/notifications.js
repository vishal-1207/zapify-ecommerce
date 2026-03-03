import api from "./axios";

export const getMyNotifications = async () => {
  const response = await api.get("/notification");
  return response.data.notifications;
};

export const markAsRead = async (notificationIds) => {
  const response = await api.patch("/notification", { notificationIds });
  return response.data;
};

export const clearAllNotifications = async () => {
  const response = await api.delete("/notification");
  return response.data;
};
