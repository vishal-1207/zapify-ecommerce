import api from "./axios";

export const createOffer = async (productId, offerData) => {
  const response = await api.post(`/offer/product/${productId}`, offerData);
  return response.data;
};

export const getMyOffers = async () => {
  const response = await api.get("/offer");
  return response.data.offers;
};

export const getMyActiveOffers = async () => {
    const response = await api.get("/offer/active");
    return response.data.offers;
};

export const updateOffer = async (offerId, offerData) => {
  const response = await api.patch(`/offer/${offerId}`, offerData);
  return response.data;
};

export const deleteOffer = async (offerId) => {
  const response = await api.delete(`/offer/${offerId}`);
  return response.data;
};
