import api from "./axios";

export const applyForAffiliate = async () => {
  const response = await api.post("/affiliate/apply");
  return response.data;
};

export const getAffiliateDashboard = async () => {
  const response = await api.get("/affiliate/dashboard");
  return response.data;
};

export const getAffiliateOrders = async () => {
  const response = await api.get("/affiliate/orders");
  return response.data.orders;
};
