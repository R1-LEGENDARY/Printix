import api from "./axios";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export const getMetrics = () => api.get("/admin/metrics", { headers: authHeaders() }).then((r) => r.data);

export const listAdminProducts = () => api.get("/admin/products", { headers: authHeaders() }).then((r) => r.data);
export const getAdminProduct = (id) => api.get(`/admin/products/${id}`, { headers: authHeaders() }).then((r) => r.data);
export const createAdminProduct = (data) => api.post("/admin/products", data, { headers: authHeaders() }).then((r) => r.data);
export const updateAdminProduct = (id, data) => api.put(`/admin/products/${id}`, data, { headers: authHeaders() }).then((r) => r.data);
export const toggleProductActive = (id) => api.patch(`/admin/products/${id}/toggle-active`, {}, { headers: authHeaders() }).then((r) => r.data);
export const upsertVariant = (productId, data) => api.post(`/admin/products/${productId}/variants`, data, { headers: authHeaders() }).then((r) => r.data);
export const upsertPrintableArea = (productId, data) => api.post(`/admin/products/${productId}/printable-areas`, data, { headers: authHeaders() }).then((r) => r.data);
export const adjustStock = (variantId, changeQty, reason) =>
  api.patch(`/admin/variants/${variantId}/stock`, { changeQty, reason }, { headers: authHeaders() }).then((r) => r.data);

export const savePerspectiveConfig = (areaId, points) =>
  api.put(`/admin/printable-areas/${areaId}/perspective`, { points }, { headers: authHeaders() }).then((r) => r.data);

export const uploadDisplacementMap = (areaId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post(`/admin/printable-areas/${areaId}/displacement-map`, formData, {
      headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const uploadMockupTemplate = (areaId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post(`/admin/printable-areas/${areaId}/mockup-template`, formData, {
      headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const listCategories = () => api.get("/admin/categories", { headers: authHeaders() }).then((r) => r.data);
export const createCategory = (data) => api.post("/admin/categories", data, { headers: authHeaders() }).then((r) => r.data);
export const updateCategory = (id, data) => api.put(`/admin/categories/${id}`, data, { headers: authHeaders() }).then((r) => r.data);
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`, { headers: authHeaders() }).then((r) => r.data);

export const uploadProductImage = (productId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post(`/admin/products/${productId}/images`, formData, {
      headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};
export const deleteProductImage = (productId, imageId) =>
  api.delete(`/admin/products/${productId}/images/${imageId}`, { headers: authHeaders() }).then((r) => r.data);
export const setPrimaryImage = (productId, imageId) =>
  api.patch(`/admin/products/${productId}/images/${imageId}/primary`, {}, { headers: authHeaders() }).then((r) => r.data);

export const listAdminOrders = (status) =>
  api.get("/admin/orders", { headers: authHeaders(), params: status ? { status } : {} }).then((r) => r.data);
export const getAdminOrder = (id) => api.get(`/admin/orders/${id}`, { headers: authHeaders() }).then((r) => r.data);
export const updateOrderStatus = (id, status, note) =>
  api.patch(`/admin/orders/${id}/status`, { status, note }, { headers: authHeaders() }).then((r) => r.data);