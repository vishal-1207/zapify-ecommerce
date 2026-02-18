import api from "./axios";

export const getAllBrands = async () => {
  const response = await api.get("/brand");
  return response.data.data?.brands || response.data.data || [];
};

export const createBrand = async (formData) => {
  const response = await api.post("/brand", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const updateBrand = async (id, formData) => {
  const response = await api.put(`/brand/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const deleteBrand = async (id) => {
  const response = await api.delete(`/brand/${id}`);
  return response.data; // Message
};

export const toggleBrandStatus = async (id) => {
  const response = await api.patch(`/brand/${id}/toggle-status`);
  return response.data.data;
};
