import api from "./axios";

export const createReview = async (orderItemId, formData) => {
  const response = await api.post(
    `/review/order-item/${orderItemId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
};

export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/review/${reviewId}`);
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

export const reportReview = async (reviewId, payload) => {
  const response = await api.post(`/review/${reviewId}/report`, payload);
  return response.data;
};

export const fetchMyReviews = async (params = {}) => {
  const response = await api.get("/review/my-reviews", { params });
  return response.data;
};

export const getSellerReviews = async (params = {}) => {
  const response = await api.get("/review/seller/my-reviews", { params });
  return response.data;
};

export const addSellerResponse = async (reviewId, responseText) => {
  const response = await api.post(`/review/${reviewId}/response`, {
    responseText,
  });
  return response.data;
};

export const getAdminReviewQueue = async (params = {}) => {
  const response = await api.get("/review/admin/queue", { params });
  return response.data;
};

export const adminModerateReview = async (reviewId, payload) => {
  const response = await api.post(
    `/review/admin/review/${reviewId}/moderate`,
    payload,
  );
  return response.data;
};

export const getAdminReviewReports = async (params = {}) => {
  const response = await api.get("/review/admin/reports", { params });
  return response.data;
};

export const resolveReport = async (reportId, resolution) => {
  const response = await api.post(`/review/admin/reports/${reportId}`, {
    resolution,
  });
  return response.data;
};
