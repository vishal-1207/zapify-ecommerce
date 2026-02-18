import api from "./axios";

export const createPaymentIntent = async (orderId) => {
  const response = await api.post("/payment/create-intent", { orderId });
  return response.data.data; // Expected { clientSecret: '...' }
};

export const getSellerTransactions = async (params) => {
  const response = await api.get("/payment/seller-transactions", { params });
  return response.data.data;
};
