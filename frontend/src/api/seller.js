import api from "./axios";

export const getSellerDashboardStats = async (days = 30) => {
  const response = await api.get(`/seller/dashboard/stats?days=${days}`);
  return response.data.data?.stats || response.data.data;
};

export const getSellerSalesAnalytics = async (days = 30) => {
  const response = await api.get(`/seller/dashboard/sales-analytics?days=${days}`);
  return response.data.data?.salesData || response.data.data;
};

export const getSellerTopProducts = async (days = 30) => {
  const response = await api.get(`/seller/dashboard/top-products?days=${days}`);
  return response.data.data?.products || response.data.data;
};

export const getSellerCategoryPerformance = async (days = 30) => {
  const response = await api.get(`/seller/dashboard/category-performance?days=${days}`);
  return response.data.data?.categoryData || response.data.data;
};

export const getSellerProfile = async () => {
    const response = await api.get("/seller/profile");
    return response.data.data?.profile || response.data.data;
};

// Start Product Suggestion APIs (using the new route I added and existing one)
export const getMyProductSuggestions = async (params = {}) => {
    const response = await api.get("/product/suggestions", { params });
    return response.data.data?.suggestions || response.data.data;
};

export const suggestNewProduct = async (sellerId, formData) => {
    const response = await api.post(`/product/suggest-product/${sellerId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
};

// Offer Management APIs
export const getSellerOffers = async (params) => {
    const response = await api.get("/seller/offers", { params });
    return response.data.data;
};

export const updateSellerOffer = async (offerId, data) => {
    const response = await api.patch(`/seller/offers/${offerId}`, data);
    return response.data.data;
};

export const deleteSellerOffer = async (offerId) => {
    const response = await api.delete(`/seller/offers/${offerId}`);
    return response.data; // Message
};

export const getSellerOrders = async (params) => {
    const response = await api.get("/seller/orders", { params });
    return response.data.data;
};

export const updateSellerOrderItemStatus = async (orderItemId, status) => {
    const response = await api.patch(`/seller/orders/${orderItemId}/status`, { status });
    return response.data.data;
};
