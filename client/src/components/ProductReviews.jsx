import { useEffect, useState } from "react";
import { getProductReviews, getReviewableItems, submitReview } from "../api/reviews";
import { useAuth } from "../context/useAuth";
import StarRating from "./StarRating";
import Button from "./Button";
import "./ProductReviews.css";

/*
 * DOCU: Product-detail review panel — shows existing approved reviews plus,
 * for logged-in verified buyers, a form to leave a new review per unreviewed order item.
 * @param {string} productId - The product these reviews belong to
 * @returns {JSX.Element} - The reviews section
 */
function ProductReviews({ productId }) {
  const { user } = useAuth();
  const [data, setData] = useState({ reviews: [], averageRating: 0, totalCount: 0 });
  const [reviewableItems, setReviewableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function load() {
    getProductReviews(productId).then(setData).finally(() => setLoading(false));
    if (user) {
      getReviewableItems(productId).then((items) => {
        setReviewableItems(items);
        setSelectedItemId(items.length === 1 ? items[0].id : "");
      }).catch(() => {});
    }
  }

  useEffect(load, [productId, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) {
      setError("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitReview({ productId, orderItemId: selectedItemId || undefined, rating, comment });
      setRating(0);
      setComment("");
      setSelectedItemId("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="product-reviews-status">Loading reviews...</p>;

  return (
    <div className="product-reviews">
      <div className="product-reviews-summary">
        <h3>Reviews</h3>
        {data.totalCount > 0 ? (
          <div className="product-reviews-summary__row">
            <StarRating value={data.averageRating} size="1.25rem" />
            <span>{data.averageRating.toFixed(1)} out of 5 ({data.totalCount} review{data.totalCount !== 1 ? "s" : ""})</span>
          </div>
        ) : (
          <p className="product-reviews-status">No reviews yet — be the first to share your thoughts.</p>
        )}
      </div>

      {user && reviewableItems.length > 0 && (
        <form className="product-reviews-form" onSubmit={handleSubmit}>
          <h4>Write a review</h4>
          {reviewableItems.length > 1 && (
            <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
              <option value="">Which order?</option>
              {reviewableItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.orderNumber} — {i.variantLabel}
                </option>
              ))}
            </select>
          )}
          <StarRating value={rating} onChange={setRating} size="1.5rem" />
          <textarea
            placeholder="How was the print quality, sizing, and overall experience?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          {error && <p className="product-reviews-error">{error}</p>}
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit review"}
          </Button>
        </form>
      )}

      <div className="product-reviews-list">
        {data.reviews.map((r) => (
          <div className="product-reviews-item" key={r.id}>
            <div className="product-reviews-item__header">
              <StarRating value={r.rating} />
              <span className="product-reviews-item__name">{r.reviewerName}</span>
              {r.verifiedPurchase && <span className="product-reviews-item__verified">Verified purchase</span>}
            </div>
            {r.comment && <p className="product-reviews-item__comment">{r.comment}</p>}
            <span className="product-reviews-item__date">{new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductReviews;