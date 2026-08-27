import api from "./axios";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export async function createDesign(productId) {
  const res = await api.post("/designs", { productId }, { headers: authHeaders() });
  return res.data;
}

export async function getDesign(id) {
  const res = await api.get(`/designs/${id}`, { headers: authHeaders() });
  return res.data;
}

export async function saveDesign(id, name, elements) {
  const res = await api.put(`/designs/${id}`, { name, elements }, { headers: authHeaders() });
  return res.data;
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/upload", formData, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
  return res.data;
}