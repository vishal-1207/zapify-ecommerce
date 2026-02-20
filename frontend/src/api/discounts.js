import api from "./axios";

export const createSellerDeal = async (offerId, dealData) => {
  const response = await api.post(`/discount/seller-deal/${offerId}`, dealData);
  return response.data;
};
