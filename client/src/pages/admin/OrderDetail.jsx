import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAdminOrder, updateOrderStatus, upsertShipment } from "../../api/admin";
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
  const [shipForm, setShipForm] = useState({ carrier: "", trackingNumber: "", estimatedDelivery: "" });
  const [savingShipment, setSavingShipment] = useState(false);

  function load() {
    getAdminOrder(id)
      .then((o) => {
        setOrder(o);
        setNextStatus(o.status);
        if (o.shipment) {
          setShipForm({
            carrier: o.shipment.carrier || "",
            trackingNumber: o.shipment.trackingNumber || "",
            estimatedDelivery: o.shipment.estimatedDelivery ? o.shipment.estimatedDelivery.slice(0, 10) : "",
          });
        }
      })
      .catch((err) => setError(err.response?.data?.message || err.message));
  }

  useEffect(load, [id]);

  async function handleSaveShipment(markAs) {
    if (!shipForm.carrier || !shipForm.trackingNumber) {
      setError("Carrier and tracking number are required.");
      return;
    }
    setSavingShipment(true);
    setError(null);
    try {
      await upsertShipment(id, { ...shipForm, markAs });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save shipment.");
    } finally {
      setSavingShipment(false);
    }
  }

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
        <div className="dash-table-wrap">
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
        </div>
        <p className="od-total">Grand total: ₱{order.grandTotal}</p>
      </section>

      <section className="od-card">
        <h2>Shipping</h2>

        {order.shipment ? (
          <div className="od-shipment-current">
            <p><strong>{order.shipment.carrier}</strong> — {order.shipment.trackingNumber}</p>
            {order.shipment.shippedAt && <p>Shipped: {new Date(order.shipment.shippedAt).toLocaleString()}</p>}
            {order.shipment.deliveredAt && <p>Delivered: {new Date(order.shipment.deliveredAt).toLocaleString()}</p>}
            {order.shipment.estimatedDelivery && !order.shipment.deliveredAt && (
              <p>Estimated delivery: {new Date(order.shipment.estimatedDelivery).toLocaleDateString()}</p>
            )}
          </div>
        ) : (
          <p className="od-shipment-current">No shipment info yet.</p>
        )}

        <div className="od-shipment-form">
          <input
            placeholder="Carrier (e.g. J&T Express)"
            value={shipForm.carrier}
            onChange={(e) => setShipForm({ ...shipForm, carrier: e.target.value })}
          />
          <input
            placeholder="Tracking number"
            value={shipForm.trackingNumber}
            onChange={(e) => setShipForm({ ...shipForm, trackingNumber: e.target.value })}
          />
          <input
            type="date"
            value={shipForm.estimatedDelivery}
            onChange={(e) => setShipForm({ ...shipForm, estimatedDelivery: e.target.value })}
          />
        </div>
        <div className="od-shipment-actions">
          <Button variant="secondary" onClick={() => handleSaveShipment()} disabled={savingShipment}>
            Save tracking info
          </Button>
          {!order.shipment?.shippedAt && (
            <Button variant="primary" onClick={() => handleSaveShipment("shipped")} disabled={savingShipment}>
              Mark as shipped
            </Button>
          )}
          {order.shipment?.shippedAt && !order.shipment?.deliveredAt && (
            <Button variant="primary" onClick={() => handleSaveShipment("delivered")} disabled={savingShipment}>
              Mark as delivered
            </Button>
          )}
        </div>
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
          {[...order.statusHistory].reverse().map((h, i) => (
            <li key={i}>
              <span className={`status-pill status-pill--${h.status}`}>{h.status}</span>
              <span className="od-history__date">
                {new Date(h.createdAt).toLocaleString(undefined, {
                  year: "numeric", month: "numeric", day: "numeric",
                  hour: "numeric", minute: "2-digit",
                })}
              </span>
              {h.note && <span className="od-history__note">{h.note}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default OrderDetail;