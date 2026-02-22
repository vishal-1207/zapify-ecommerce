import api from "./axios";

export const createOrder = async (addressId) => {
  const response = await api.post("/order", { addressId });
  return response.data.data;
};

export const getMyOrders = async () => {
  const response = await api.get("/order");
  return response.data.data;
};

export const getOrderDetails = async (orderId) => {
  const response = await api.get(`/order/${orderId}`);
  return response.data.data;
};

export const cancelOrder = async (orderId, reason) => {
  const response = await api.patch(`/order/${orderId}/cancel`, { reason });
  return response.data;
};

export const requestReturn = async (orderId, reason) => {
  const response = await api.post(`/order/${orderId}/return`, { reason });
  return response.data;
};
