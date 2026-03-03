import api from "./axios";

export const getMyTransactions = async () => {
  const response = await api.get("/payment/my-transactions");
  return response.data.data || [];
};

export const verifyPayment = async (paymentIntentId) => {
  const response = await api.post("/payment/verify", { paymentIntentId });
  return response.data.data;
};
