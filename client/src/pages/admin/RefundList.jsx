import { useEffect, useState } from "react";
import { listRefunds, updateRefundStatus } from "../../api/admin";
import "./Dashboard.css";
import "./RefundList.css";

function RefundList() {
  const [refunds, setRefunds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("requested");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  function load() {
    setLoading(true);
    listRefunds(statusFilter || undefined).then(setRefunds).finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter]);

  async function handleAction(id, status) {
    if (status === "approved" && !window.confirm("This will process the refund through PayMongo. Continue?")) return;
    setProcessingId(id);
    try {
      await updateRefundStatus(id, status);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update refund.");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div>
      <h1>Refunds</h1>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rf-filter">
        <option value="">All</option>
        <option value="requested">Requested</option>
        <option value="approved">Approved</option>
        <option value="completed">Completed</option>
        <option value="rejected">Rejected</option>
      </select>

      {loading ? (
        <p className="admin-status">Loading refunds...</p>
      ) : refunds.length === 0 ? (
        <p className="admin-status">No refunds found.</p>
      ) : (
        <div className="rf-list">
          {refunds.map((r) => (
            <div className="rf-item" key={r.id}>
              <div className="rf-item__header">
                <strong>Order #{r.orderNumber}</strong>
                <span className={`status-pill status-pill--${r.status === "completed" ? "delivered" : r.status === "rejected" ? "cancelled" : "pending"}`}>
                  {r.status}
                </span>
              </div>
              <p className="rf-item__meta">{r.customerName} — ₱{r.amount} — {new Date(r.createdAt).toLocaleDateString()}</p>
              {r.reason && <p className="rf-item__reason">"{r.reason}"</p>}
              <ul className="rf-item__items">
                {r.items.map((i) => (
                  <li key={i.id}>{i.productName} ({i.variantLabel}) × {i.quantity} — ₱{i.amount}</li>
                ))}
              </ul>
              {r.status === "requested" && (
                <div className="rf-item__actions">
                  <button disabled={processingId === r.id} onClick={() => handleAction(r.id, "approved")}>
                    {processingId === r.id ? "Processing..." : "Approve & refund"}
                  </button>
                  <button disabled={processingId === r.id} onClick={() => handleAction(r.id, "rejected")}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RefundList;