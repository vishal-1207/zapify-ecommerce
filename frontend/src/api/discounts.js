import api from "./axios";

export const createSellerDeal = async (offerId, dealData) => {
  const response = await api.post(`/discount/seller-deal/${offerId}`, dealData);
  return response.data;
};

// ... other discount API methods can be moved here later if needed
