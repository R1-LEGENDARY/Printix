import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";
import { startCheckoutSession, getPaymentStatus } from "../api/payment";
import Button from "../components/Button";
import RefundRequestModal from "../components/RefundRequestModal";
import "./OrderConfirmation.css";

function OrderConfirmation() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const paymentResult = searchParams.get("payment"); 
  const [order, setOrder] = useState(null);
  const [payingNow, setPayingNow] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const refreshOrder = useCallback(() => {
    const token = localStorage.getItem("token");
    return api
      .get("/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrder(res.data.find((o) => o.id === id)))
      .catch(() => setOrder(null));
  }, [id]);

  useEffect(() => {
    refreshOrder();
  }, [refreshOrder]);

  useEffect(() => {
    if (paymentResult !== "success") return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      const { status } = await getPaymentStatus(id).catch(() => ({ status: null }));
      if (status === "paid" || attempts >= 10) {
        clearInterval(interval);
        refreshOrder();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [paymentResult, id, refreshOrder]);

  async function handlePayNow() {
    setPayingNow(true);
    try {
      const { checkoutUrl } = await startCheckoutSession(id);
      window.location.href = checkoutUrl;
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start payment.");
      setPayingNow(false);
    }
  }

  if (!order) return <p className="oc-status">Loading order...</p>;

  return (
    <div className="oc">
      <h2>Thank you for your order!</h2>
      <p className="oc__number">Order #{order.orderNumber}</p>
      <p className="oc__status">Status: {order.status}</p>

      <div className="oc__items">
        {order.items.map((item) => (
          <div className="oc__item" key={item.id}>
            <div className="oc__item-info">
              {item.mockupUrl && (
                <img className="oc__item-thumb" src={`http://localhost:5000${item.mockupUrl}`} alt="" />
              )}
              <span>{item.productName} ({item.variantLabel}) × {item.quantity}</span>
            </div>
            <span>₱{item.lineTotal}</span>
          </div>
        ))}
      </div>

      {Number(order.discountTotal) > 0 && (
        <div className="oc__item">
          <span>Discount</span>
          <span>−₱{order.discountTotal}</span>
        </div>
      )}

      <div className="oc__total">
        <span>Total</span>
        <span>₱{order.grandTotal}</span>
      </div>

      {order.status === "pending" && (
        <div className="oc__payment">
          {paymentResult === "cancelled" && (
            <p className="oc__payment-note oc__payment-note--warn">
              Payment was cancelled. You can try again below.
            </p>
          )}
          {paymentResult === "success" && (
            <p className="oc__payment-note">
              Confirming your payment — this updates automatically once verified...
            </p>
          )}
          <Button variant="primary" className="btn--block" onClick={handlePayNow} disabled={payingNow}>
            {payingNow ? "Redirecting to payment..." : "Pay now"}
          </Button>
        </div>
      )}

      {order.status === "paid" && (
        <p className="oc__payment-note oc__payment-note--success">Payment confirmed. Thank you!</p>
      )}

      {order.shipment && (
        <div className="oc__shipment">
          <h3>Shipping</h3>
          <p><strong>{order.shipment.carrier}</strong> — {order.shipment.trackingNumber}</p>
          {order.shipment.deliveredAt ? (
            <p className="oc__shipment-status">Delivered on {new Date(order.shipment.deliveredAt).toLocaleDateString()}</p>
          ) : order.shipment.shippedAt ? (
            <p className="oc__shipment-status">
              Shipped {new Date(order.shipment.shippedAt).toLocaleDateString()}
              {order.shipment.estimatedDelivery && ` — estimated ${new Date(order.shipment.estimatedDelivery).toLocaleDateString()}`}
            </p>
          ) : null}
        </div>
      )}

      {["paid", "processing", "printing", "shipped", "delivered"].includes(order.status) && (
        <Button variant="secondary" className="btn--block" onClick={() => setShowRefundModal(true)}>
          Request a refund
        </Button>
      )}

      {showRefundModal && (
        <RefundRequestModal
          order={order}
          onClose={() => setShowRefundModal(false)}
          onSubmitted={() => {
            setShowRefundModal(false);
            alert("Refund request submitted — you'll be notified once it's reviewed.");
          }}
        />
      )}

      <Link to="/catalog">
        <Button variant="secondary">Continue shopping</Button>
      </Link>
    </div>
  );
}

export default OrderConfirmation;