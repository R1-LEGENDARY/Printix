import { useCallback, useEffect, useState } from "react";
import { listRefunds, updateRefundStatus } from "../../api/admin";
import ConfirmModal from "../../components/ConfirmModal";
import "./Dashboard.css";
import "./RefundList.css";

function RefundList() {
  const [refunds, setRefunds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("requested");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    listRefunds(statusFilter || undefined).then(setRefunds).finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const [error, setError] = useState(null);

  function askAction(id, status) {
    setPendingAction({ id, status });
  }

  async function handleAction(id, status) {
    setProcessingId(id);
    setError(null);
    try {
      await updateRefundStatus(id, status);
      setPendingAction(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update refund.");
      setPendingAction(null);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div>
      <h1>Refunds</h1>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="refund-filter">
        <option value="">All</option>
        <option value="requested">Requested</option>
        <option value="approved">Approved</option>
        <option value="completed">Completed</option>
        <option value="rejected">Rejected</option>
      </select>

      {error && <p className="admin-error">{error}</p>}

      <ConfirmModal
        open={Boolean(pendingAction)}
        title={pendingAction?.status === "approved" ? "Approve refund" : "Reject refund"}
        message={
          pendingAction?.status === "approved"
            ? "This will process the refund through PayMongo. Continue?"
            : "Reject this refund request?"
        }
        confirmText={pendingAction?.status === "approved" ? "Approve" : "Reject"}
        destructive
        onConfirm={() => pendingAction && handleAction(pendingAction.id, pendingAction.status)}
        onClose={() => setPendingAction(null)}
      />

      {loading ? (
        <p className="admin-status">Loading refunds...</p>
      ) : refunds.length === 0 ? (
        <p className="admin-status">No refunds found.</p>
      ) : (
        <div className="refund-list">
          {refunds.map((r) => (
            <article className="refund-item" key={r.id}>
              <div className="refund-item__header">
                <strong>Order #{r.orderNumber}</strong>
                <span className={`status-pill status-pill--${r.status === "completed" ? "delivered" : r.status === "rejected" ? "cancelled" : "pending"}`}>
                  {r.status}
                </span>
              </div>
              <p className="refund-item__meta">{r.customerName} — ₱{r.amount} — {new Date(r.createdAt).toLocaleDateString()}</p>
              {r.reason && <p className="refund-item__reason">"{r.reason}"</p>}
              <ul className="refund-item__items">
                {r.items.map((i) => (
                  <li key={i.id}>{i.productName} ({i.variantLabel}) × {i.quantity} — ₱{i.amount}</li>
                ))}
              </ul>
              {r.status === "requested" && (
                <div className="refund-item__actions">
                  <button type="button" disabled={processingId === r.id} onClick={() => askAction(r.id, "approved")}>
                    {processingId === r.id ? "Processing..." : "Approve & refund"}
                  </button>
                  <button type="button" disabled={processingId === r.id} onClick={() => askAction(r.id, "rejected")}>
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default RefundList;