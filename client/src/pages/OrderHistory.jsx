import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Button from "../components/Button";
import "./OrderHistory.css";

const statusLabels = {
  pending: "Pending payment",
  paid: "Paid",
  processing: "Processing",
  printing: "Printing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    api
      .get("/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="oh-status">Loading your orders...</p>;
  if (error) return <p className="oh-status">Error: {error}</p>;

  if (orders.length === 0) {
    return (
      <div className="oh oh--empty">
        <h2>You haven't placed any orders yet</h2>
        <p>Find something you'd like to customize.</p>
        <Link to="/catalog">
          <Button variant="primary">Browse products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="oh">
      <h2>Your orders</h2>

      {orders.length === 0 ? null : (
        <div className="oh-list">
          {orders.map((order) => (
            <Link to={`/orders/${order.id}`} key={order.id} className="oh-card">
              <div className="oh-card__header">
                <div>
                  <p className="oh-card__number">Order #{order.orderNumber}</p>
                  <p className="oh-card__date">
                    {new Date(order.placedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className={`oh-card__status oh-card__status--${order.status}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              <div className="oh-card__items">
                {order.items.slice(0, 3).map((item) => (
                  <span key={item.id} className="oh-card__item">
                    {item.productName} × {item.quantity}
                  </span>
                ))}
                {order.items.length > 3 && (
                  <span className="oh-card__item">+{order.items.length - 3} more</span>
                )}
              </div>

              <div className="oh-card__footer">
                <span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                <span className="oh-card__total">₱{order.grandTotal}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;