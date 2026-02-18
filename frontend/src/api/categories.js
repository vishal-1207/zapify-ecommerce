import api from "./axios";

export const getAllCategories = async () => {
  const response = await api.get("/category");
  return response.data.data?.categories || response.data.data || [];
};

export const createCategory = async (formData) => {
  const response = await api.post("/category", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const updateCategory = async (id, formData) => {
  const response = await api.put(`/category/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/category/${id}`);
  return response.data; // Message
};

export const toggleCategoryStatus = async (id) => {
  const response = await api.patch(`/category/${id}/toggle-status`);
  return response.data.data;
};
