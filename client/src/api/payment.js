import api from "./axios";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export async function startCheckoutSession(orderId) {
  const res = await api.post(
    "/payments/checkout-session",
    { orderId },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function getPaymentStatus(orderId) {
  const res = await api.get(`/payments/status/${orderId}`, { headers: authHeaders() });
  return res.data;
}