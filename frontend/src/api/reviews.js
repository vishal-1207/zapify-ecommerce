import api from "./axios";

export const createReview = async (orderItemId, formData) => {
  const response = await api.post(
    `/review/order-item/${orderItemId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const getProductReviews = async (productId) => {
  const response = await api.get(`/review/product/${productId}`);
  return response.data;
};

export const toggleReviewVote = async (reviewId, voteType) => {
  const response = await api.post(`/review/${reviewId}/vote`, { voteType });
  return response.data;
};
