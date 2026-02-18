import api from "./axios";

export const getAllProducts = async (params = {}) => {
  const response = await api.get("/product", { params });
  // New ApiResponse: response.data.data is { products, total }
  // Calling code expects Array.
  // We need to check if it returns { products, total } or just Array.
  // In product.controller.js getAllProducts: new ApiResponse(200, { products, total, ... })
  // So response.data.data.products is the array.
  return response.data.data?.products || response.data.data || [];
};

export const getPendingProducts = async (params = {}) => {
  const response = await api.get("/product/review/pending", { params });
  return response.data.data?.result || response.data.data || [];
};

// Fetch single product by ID
export const getProductById = async (id) => {
  // If your backend has a direct GET /product/:id endpoint:
  // const response = await api.get(`/product/${id}`);
  // return response.data.data || response.data;

  // Fallback: If only list is available (per doc interpretation), we fetch list and find.
  // Ideally, backend should support /product/:id
  // For now, let's assume standard REST:
  const response = await api.get(`/product/${id}`);
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

export const getRecommendations = async () => {
  const products = await getAllProducts();
  return products.slice(0, 4); // Just random for now
};

// Search (Algolia/Backend powered)
// Search (Algolia/Backend powered)
export const searchProducts = async (query) => {
  const response = await api.get(`/search/q?q=${query}`);
  return response.data.data || [];
};

export const searchCatalog = async (query, params = {}) => {
  const response = await api.get(`/product/catalog-search?q=${query}`, { params });
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
