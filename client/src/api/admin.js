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
export const deleteProduct = (id) => api.delete(`/admin/products/${id}`, { headers: authHeaders() });
export const upsertVariant = (productId, data) => api.post(`/admin/products/${productId}/variants`, data, { headers: authHeaders() }).then((r) => r.data);
export const upsertPrintableArea = (productId, data) => api.post(`/admin/products/${productId}/printable-areas`, data, { headers: authHeaders() }).then((r) => r.data);
export const upsertShipment = (orderId, data) =>
  api.post(`/admin/orders/${orderId}/shipment`, data, { headers: authHeaders() }).then((r) => r.data);

export const listRefunds = (status) =>
  api.get("/admin/refunds", { headers: authHeaders(), params: status ? { status } : {} }).then((r) => r.data);
export const updateRefundStatus = (id, status) =>
  api.patch(`/admin/refunds/${id}/status`, { status }, { headers: authHeaders() }).then((r) => r.data);

export const listCoupons = () => api.get("/admin/coupons", { headers: authHeaders() }).then((r) => r.data);
export const createCoupon = (data) => api.post("/admin/coupons", data, { headers: authHeaders() }).then((r) => r.data);
export const updateCoupon = (id, data) => api.put(`/admin/coupons/${id}`, data, { headers: authHeaders() }).then((r) => r.data);
export const deleteCoupon = (id) => api.delete(`/admin/coupons/${id}`, { headers: authHeaders() });

export const getSalesAnalytics = (days) =>
  api.get("/admin/analytics", { headers: authHeaders(), params: { days } }).then((r) => r.data);

export const listAllReviews = (status) =>
  api.get("/admin/reviews", { headers: authHeaders(), params: status ? { status } : {} }).then((r) => r.data);
export const setReviewApproval = (id, isApproved) =>
  api.patch(`/admin/reviews/${id}/approval`, { isApproved }, { headers: authHeaders() }).then((r) => r.data);
export const deleteReview = (id) => api.delete(`/admin/reviews/${id}`, { headers: authHeaders() });

export const adjustStock = (variantId, changeQty, reason) =>
  api.patch(`/admin/variants/${variantId}/stock`, { changeQty, reason }, { headers: authHeaders() }).then((r) => r.data);

export const savePerspectiveConfig = (areaId, points, variantId) =>
  api.put(`/admin/printable-areas/${areaId}/perspective`, { points, variantId }, { headers: authHeaders() }).then((r) => r.data);

export const uploadDisplacementMap = (areaId, file, variantId) => {
  const formData = new FormData();
  formData.append("file", file);
  if (variantId) formData.append("variantId", variantId);
  return api
    .post(`/admin/printable-areas/${areaId}/displacement-map`, formData, {
      headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const uploadMockupTemplate = (areaId, file, variantId) => {
  const formData = new FormData();
  formData.append("file", file);
  if (variantId) formData.append("variantId", variantId);
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