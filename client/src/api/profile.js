import api from "./axios";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export const updateProfile = (name) => api.put("/auth/me", { name }, { headers: authHeaders() }).then((r) => r.data);
export const changePassword = (currentPassword, newPassword) =>
  api.put("/auth/me/password", { currentPassword, newPassword }, { headers: authHeaders() }).then((r) => r.data);

export const updateAddress = (id, data) => api.put(`/addresses/${id}`, data, { headers: authHeaders() }).then((r) => r.data);
export const deleteAddress = (id) => api.delete(`/addresses/${id}`, { headers: authHeaders() });
export const setDefaultAddress = (id) => api.patch(`/addresses/${id}/default`, {}, { headers: authHeaders() }).then((r) => r.data);