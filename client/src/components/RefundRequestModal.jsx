import { useState } from "react";
import { requestRefund } from "../api/refunds";
import Button from "./Button";
import "./RefundRequestModal.css";

function RefundRequestModal({ order, onClose, onSubmitted }) {
  const [selected, setSelected] = useState({});
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function toggleItem(itemId, maxQty) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[itemId]) delete next[itemId];
      else next[itemId] = 1;
      return next;
    });
  }

  function setQty(itemId, qty, maxQty) {
    setSelected((prev) => ({ ...prev, [itemId]: Math.min(maxQty, Math.max(1, qty)) }));
  }

  async function handleSubmit() {
    const items = Object.entries(selected).map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (items.length === 0) {
      setError("Select at least one item to refund.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await requestRefund(order.id, items, reason);
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit refund request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rr-overlay" onClick={onClose}>
      <div className="rr-panel" onClick={(e) => e.stopPropagation()}>
        <h3>Request a refund</h3>
        <p className="rr-note">Select the items you'd like refunded from order #{order.orderNumber}.</p>

        <div className="rr-items">
          {order.items.map((item) => (
            <div className="rr-item" key={item.id}>
              <label className="rr-item__check">
                <input
                  type="checkbox"
                  checked={!!selected[item.id]}
                  onChange={() => toggleItem(item.id, item.quantity)}
                />
                {item.productName} ({item.variantLabel})
              </label>
              {selected[item.id] && (
                <input
                  type="number"
                  min={1}
                  max={item.quantity}
                  value={selected[item.id]}
                  onChange={(e) => setQty(item.id, Number(e.target.value), item.quantity)}
                  className="rr-item__qty"
                />
              )}
            </div>
          ))}
        </div>

        <textarea
          placeholder="Reason for refund (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />

        {error && <p className="rr-error">{error}</p>}

        <div className="rr-actions">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit request"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RefundRequestModal;