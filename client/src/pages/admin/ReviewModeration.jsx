import { useCallback, useEffect, useState } from "react";
import { listAllReviews, setReviewApproval, deleteReview } from "../../api/admin";
import ConfirmModal from "../../components/ConfirmModal";
import StarRating from "../../components/StarRating";
import "./Dashboard.css";
import "./ReviewModeration.css";

function ReviewModeration() {
  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    listAllReviews(statusFilter || undefined).then(setReviews).finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function handleApproval(id, isApproved) {
    await setReviewApproval(id, isApproved);
    load();
  }

  function askDelete(id) {
    setPendingDelete(id);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    await deleteReview(pendingDelete);
    setPendingDelete(null);
    load();
  }

  return (
    <div>
      <h1>Review moderation</h1>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="review-moderation-filter">
        <option value="">All reviews</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
      </select>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete review"
        message="Delete this review permanently?"
        confirmText="Delete"
        destructive
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />

      {loading ? (
        <p className="admin-status">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="admin-status">No reviews found.</p>
      ) : (
        <div className="review-moderation-list">
          {reviews.map((r) => (
            <article className="review-moderation-item" key={r.id}>
              <div className="review-moderation-item__header">
                <StarRating value={r.rating} />
                <span className="review-moderation-item__product">{r.productName}</span>
                <span className={`status-pill ${r.isApproved ? "status-pill--delivered" : "status-pill--pending"}`}>
                  {r.isApproved ? "Approved" : "Pending"}
                </span>
                {r.verifiedPurchase && <span className="review-moderation-item__verified">Verified</span>}
              </div>
              <p className="review-moderation-item__meta">{r.reviewerName} ({r.reviewerEmail}) — {new Date(r.createdAt).toLocaleDateString()}</p>
              {r.comment && <p className="review-moderation-item__comment">{r.comment}</p>}
              <div className="review-moderation-item__actions">
                {!r.isApproved && <button type="button" onClick={() => handleApproval(r.id, true)}>Approve</button>}
                {r.isApproved && <button type="button" onClick={() => handleApproval(r.id, false)}>Unapprove</button>}
                <button type="button" onClick={() => askDelete(r.id)} className="review-moderation-item__delete">Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewModeration;