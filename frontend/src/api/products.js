import api from "./axios";

export const getAllProducts = async (params = {}, signal) => {
  const response = await api.get("/product", { params, signal });
  return response.data.data?.products || response.data.data || [];
};

export const getPendingProducts = async (params = {}) => {
  const response = await api.get("/product/review/pending", { params });
  return response.data.data?.result || response.data.data || [];
};

// Fetch single product by ID
export const getProductById = async (id, signal) => {
  const response = await api.get(`/product/${id}`, { signal });
  return response.data.data?.product || response.data.data || response.data;
};

// Helpers for Home Page (Filtering client-side or via specific API params)
export const getFeaturedProducts = async () => {
  const products = await getAllProducts({ limit: 4, sort: "-rating" }); // Mocking params
  // getAllProducts now returns Array from .products
  return products.slice(0, 4);
};

export const getNewArrivals = async () => {
  const products = await getAllProducts({ sort: "-createdAt" });
  return products.slice(0, 8);
};

export const getPopularProducts = async () => {
  const products = await getAllProducts({ sort: "-reviews" });
  return products.slice(0, 5);
};

export const getRecommendations = async (signal) => {
  const products = await getAllProducts({}, signal);
  return products.slice(0, 4); // Just random for now
};

// Search (Algolia/Backend powered)
// Search (Algolia/Backend powered)
export const searchProducts = async (query) => {
  const response = await api.get(`/search/q?q=${query}`);
  return response.data.data || [];
};

export const searchCatalog = async (query, params = {}) => {
  const response = await api.get(`/product/catalog-search?q=${query}`, {
    params,
  });
  return response.data.data.results;
};

export const toggleProductStatus = async (id) => {
  const response = await api.patch(`/product/a/${id}/toggle-status`);
  return response.data;
};

export const getAdminProductDetails = async (id) => {
  const response = await api.get(`/product/a/${id}`);
  return response.data.data?.product || response.data.data;
};

export const createProduct = async (formData) => {
  const response = await api.post("/product", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const updateProduct = async (id, formData) => {
  const response = await api.patch(`/product/a/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data?.result || response.data.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/product/a/${id}`);
  return response.data; // Message
};
