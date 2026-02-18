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
