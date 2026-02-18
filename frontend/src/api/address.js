import api from "./axios";

// Assuming strict role-based routes, we use /address/customer for users.
// If seller, we might need /address/seller. But for now, user checkout flow is priority.

export const getUserAddresses = async () => {
  const response = await api.get("/address/customer");
  return response.data.data;
};

export const createUserAddress = async (addressData) => {
  const response = await api.post("/address/customer", addressData);
  return response.data.data;
};

export const updateUserAddress = async (id, addressData) => {
  const response = await api.patch(`/address/customer/${id}`, addressData);
  return response.data.data;
};

export const deleteUserAddress = async (id) => {
  const response = await api.delete(`/address/customer/${id}`);
  return response.data;
};
