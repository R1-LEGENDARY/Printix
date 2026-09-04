import api from "./axios";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export const requestRefund = (orderId, items, reason) =>
  api.post("/refunds", { orderId, items, reason }, { headers: authHeaders() }).then((r) => r.data);
export const listMyRefunds = () => api.get("/refunds", { headers: authHeaders() }).then((r) => r.data);