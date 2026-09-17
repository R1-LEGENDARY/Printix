import { useCallback, useEffect, useState } from "react";
import { listAllReviews, setReviewApproval, deleteReview } from "../../api/admin";
import StarRating from "../../components/StarRating";
import "./Dashboard.css";
import "./ReviewModeration.css";

function ReviewModeration() {
  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

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

  async function handleDelete(id) {
    if (!window.confirm("Delete this review permanently?")) return;
    await deleteReview(id);
    load();
  }

  return (
    <div>
      <h1>Review moderation</h1>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rm-filter">
        <option value="">All reviews</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
      </select>

      {loading ? (
        <p className="admin-status">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="admin-status">No reviews found.</p>
      ) : (
        <div className="rm-list">
          {reviews.map((r) => (
            <div className="rm-item" key={r.id}>
              <div className="rm-item__header">
                <StarRating value={r.rating} />
                <span className="rm-item__product">{r.productName}</span>
                <span className={`status-pill ${r.isApproved ? "status-pill--delivered" : "status-pill--pending"}`}>
                  {r.isApproved ? "Approved" : "Pending"}
                </span>
                {r.verifiedPurchase && <span className="rm-item__verified">Verified</span>}
              </div>
              <p className="rm-item__meta">{r.reviewerName} ({r.reviewerEmail}) — {new Date(r.createdAt).toLocaleDateString()}</p>
              {r.comment && <p className="rm-item__comment">{r.comment}</p>}
              <div className="rm-item__actions">
                {!r.isApproved && <button type="button" onClick={() => handleApproval(r.id, true)}>Approve</button>}
                {r.isApproved && <button type="button" onClick={() => handleApproval(r.id, false)}>Unapprove</button>}
                <button type="button" onClick={() => handleDelete(r.id)} className="rm-item__delete">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewModeration;