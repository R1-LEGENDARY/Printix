import api from "./axios";

export async function registerUser(data) {
  const res = await api.post("/auth/register", data);
  return res.data;
}

export async function loginUser(data) {
  const res = await api.post("/auth/login", data);
  return res.data;
}

export async function loginWithGoogle(credential) {
  const res = await api.post("/auth/google", { credential });
  return res.data;
}

export async function requestPasswordReset(email) {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
}

export async function resetPassword(token, password) {
  const res = await api.post(`/auth/reset-password/${encodeURIComponent(token)}`, { password });
  return res.data;
}