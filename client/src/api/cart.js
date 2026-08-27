import api from "./axios";

function cartHeaders() {
  const token = localStorage.getItem("token");
  const cartId = localStorage.getItem("cartId");
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cartId) headers["x-cart-id"] = cartId;
  return headers;
}

export async function fetchCart() {
  const res = await api.get("/cart", { headers: cartHeaders() });
  localStorage.setItem("cartId", res.data.id);
  return res.data;
}

export async function addToCart(productVariantId, quantity = 1, designId = null) {
  const res = await api.post(
    "/cart/items",
    { productVariantId, quantity, designId },
    { headers: cartHeaders() }
  );
  localStorage.setItem("cartId", res.data.id);
  return res.data;
}

export async function updateCartItem(itemId, quantity) {
  const res = await api.put(`/cart/items/${itemId}`, { quantity }, { headers: cartHeaders() });
  return res.data;
}

export async function removeCartItem(itemId) {
  const res = await api.delete(`/cart/items/${itemId}`, { headers: cartHeaders() });
  return res.data;
}