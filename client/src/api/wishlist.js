import api from "./axios";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export const fetchWishlist = () => api.get("/wishlist", { headers: authHeaders() }).then((r) => r.data);
export const addWishlistItem = (productVariantId) =>
  api.post("/wishlist", { productVariantId }, { headers: authHeaders() }).then((r) => r.data);
export const removeWishlistItem = (variantId) =>
  api.delete(`/wishlist/${variantId}`, { headers: authHeaders() });