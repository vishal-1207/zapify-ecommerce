import api from "./axios";

export const getWishlist = async () => {
  const response = await api.get("/wishlist");
  return response.data.data || [];
};

export const addToWishlist = async (productId) => {
  const response = await api.post("/wishlist/add", { productId });
  return response.data.data;
};

export const removeFromWishlist = async (productId) => {
  const response = await api.delete("/wishlist/remove", {
    data: { productId },
  });
  return response.data;
};
