import api from "./axios";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export const getProductReviews = (productId) => api.get(`/reviews/product/${productId}`).then((r) => r.data);
export const getReviewableItems = (productId) =>
  api.get(`/reviews/reviewable/${productId}`, { headers: authHeaders() }).then((r) => r.data);
export const submitReview = (data) => api.post("/reviews", data, { headers: authHeaders() }).then((r) => r.data);