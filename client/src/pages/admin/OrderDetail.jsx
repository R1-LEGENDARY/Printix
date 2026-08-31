import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAdminOrder, updateOrderStatus } from "../../api/admin";
import Button from "../../components/Button";
import "./OrderDetail.css";

const statusFlow = ["pending", "paid", "processing", "printing", "shipped", "delivered"];
const allStatuses = [...statusFlow, "cancelled", "refunded"];

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  function load() {
    getAdminOrder(id)
      .then((o) => {
        setOrder(o);
        setNextStatus(o.status);
      })
      .catch((err) => setError(err.response?.data?.message || err.message));
  }

  useEffect(load, [id]);

  async function handleStatusUpdate() {
    if (nextStatus === order.status) return;
    if (!window.confirm(`Change order status to "${nextStatus}"?`)) return;

    setUpdating(true);
    setError(null);
    try {
      await updateOrderStatus(id, nextStatus, note || undefined);
      setNote("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  }

  if (error && !order) return <p className="admin-error">{error}</p>;
  if (!order) return <p className="admin-status">Loading order...</p>;

  return (
    <div className="od">
      <h1>Order #{order.orderNumber}</h1>
      <span className={`status-pill status-pill--${order.status}`}>{order.status}</span>

      <div className="od-grid">
        <section className="od-card">
          <h2>Customer</h2>
          <p>{order.customer.name}</p>
          <p>{order.customer.email}</p>
        </section>

        <section className="od-card">
          <h2>Shipping address</h2>
          <p>{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}</p>
          <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}</p>
          <p>{order.shippingAddress.country} — {order.shippingAddress.phone}</p>
        </section>

        <section className="od-card">
          <h2>Payment</h2>
          {order.payments.length === 0 ? (
            <p>No payment recorded yet.</p>
          ) : (
            order.payments.map((p) => (
              <p key={p.id}>
                {p.gateway} — <span className={`status-pill status-pill--${p.status === "succeeded" ? "delivered" : p.status === "failed" ? "cancelled" : "pending"}`}>{p.status}</span> — ₱{p.amount}
              </p>
            ))
          )}
        </section>
      </div>

      <section className="od-card">
        <h2>Items</h2>
        <table className="dash-table">
          <thead>
            <tr><th>Product</th><th>Variant</th><th>Qty</th><th>Unit price</th><th>Total</th><th>Design</th></tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.productName}</td>
                <td>{item.variantLabel}</td>
                <td>{item.quantity}</td>
                <td>₱{item.unitPrice}</td>
                <td>₱{item.lineTotal}</td>
                <td>{item.hasDesign ? "Custom" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="od-total">Grand total: ₱{order.grandTotal}</p>
      </section>

      <section className="od-card">
        <h2>Update status</h2>
        <div className="od-status-form">
          <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
            {allStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input placeholder="Optional note" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button variant="primary" onClick={handleStatusUpdate} disabled={updating || nextStatus === order.status}>
            {updating ? "Updating..." : "Update status"}
          </Button>
        </div>
        {error && <p className="admin-error">{error}</p>}
      </section>

      <section className="od-card">
        <h2>Status history</h2>
        <ul className="od-history">
          {order.statusHistory.map((h, i) => (
            <li key={i}>
              <span className={`status-pill status-pill--${h.status}`}>{h.status}</span>
              <span className="od-history__date">{new Date(h.createdAt).toLocaleString()}</span>
              {h.note && <span className="od-history__note">{h.note}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default OrderDetail;