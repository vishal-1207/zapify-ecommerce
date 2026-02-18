import api from "./axios";

export const getCart = async () => {
  const response = await api.get("/cart");
  return response.data.data;
};

export const addToCart = async (offerId, quantity = 1) => {
  const response = await api.post("/cart", { offerId, quantity });
  return response.data.data;
};

export const updateCartItem = async (offerId, quantity) => {
  const response = await api.patch(`/cart/${offerId}`, { quantity });
  return response.data.data;
};

export const removeFromCart = async (offerId) => {
  const response = await api.delete(`/cart/${offerId}`);
  return response.data.data;
};

export const clearCart = async () => {
  const response = await api.delete("/cart");
  return response.data;
};
