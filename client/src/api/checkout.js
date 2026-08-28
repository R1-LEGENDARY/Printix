import api from "./axios";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export async function fetchAddresses() {
  const res = await api.get("/addresses", { headers: authHeaders() });
  return res.data;
}

export async function createAddress(data) {
  const res = await api.post("/addresses", data, { headers: authHeaders() });
  return res.data;
}

export async function placeOrder(shippingAddressId, billingAddressId) {
  const res = await api.post(
    "/orders",
    { shippingAddressId, billingAddressId },
    { headers: authHeaders() }
  );
  return res.data;
}