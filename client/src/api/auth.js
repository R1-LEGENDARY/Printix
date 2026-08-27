import api from "./axios";

export async function registerUser(data) {
  const res = await api.post("/auth/register", data);
  return res.data;
}

export async function loginUser(data) {
  const res = await api.post("/auth/login", data);
  return res.data;
}