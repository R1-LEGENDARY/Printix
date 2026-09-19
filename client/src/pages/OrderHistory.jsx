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

const TABS = [
  { key: "to_pay", label: "To Pay", statuses: ["pending"] },
  { key: "to_ship", label: "To Ship", statuses: ["paid", "processing", "printing"] },
  { key: "to_receive", label: "To Receive", statuses: ["shipped"] },
  { key: "completed", label: "Completed", statuses: ["delivered"] },
  { key: "refunded", label: "Refunded", statuses: ["refunded"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

function OrderStatusIcon({ type }) {
  const paths = {
    all: <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></>,
    to_pay: <><circle cx="12" cy="12" r="8" /><path d="M12 7v10M15 9.5c-.7-.8-1.6-1.2-3-1.2-1.5 0-2.5.7-2.5 1.8 0 2.8 5.5 1.1 5.5 4 0 1.2-1.1 2.1-2.8 2.1-1.4 0-2.4-.4-3.2-1.2" /></>,
    to_ship: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z" /><circle cx="7" cy="18" r="1.5" /><circle cx="18" cy="18" r="1.5" /></>,
    to_receive: <><path d="M4 5h16v14H4zM8 9l4 4 4-4" /></>,
    completed: <><circle cx="12" cy="12" r="8" /><path d="m8 12 2.5 2.5L16 9" /></>,
    refunded: <><path d="M20 11a8 8 0 0 0-14.5-4L4 9M4 5v4h4" /><path d="M4 13a8 8 0 0 0 14.5 4L20 15m0 4v-4h-4" /></>,
    cancelled: <><circle cx="12" cy="12" r="8" /><path d="m9 9 6 6m0-6-6 6" /></>,
  };

  return <svg className="order-history-tab__icon" viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>;
}

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");

    api
      .get("/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setOrders(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || err.message)
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="order-history-status">Loading your orders...</p>;
  }

  if (error) {
    return <p className="order-history-status">Error: {error}</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="order-history order-history--empty">
        <h2>You haven't placed any orders yet</h2>
        <p>Find something you'd like to customize.</p>

        <Link to="/catalog">
          <Button variant="primary" className="btn--browse-products">Browse products</Button>
        </Link>
      </div>
    );
  }

  const hasCancelled = orders.some(
    (order) => order.status === "cancelled"
  );

  const tabsToShow = TABS.filter(
    (tab) => tab.key !== "cancelled" || hasCancelled
  );

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((order) =>
          TABS.find((tab) => tab.key === activeTab)?.statuses.includes(
            order.status
          )
        );

  return (
    <div className="order-history">
      <h2>Your orders</h2>

      <div className="order-history-tabs">
        <button
          type="button"
          className={activeTab === "all" ? "order-history-tab--active" : ""}
          onClick={() => setActiveTab("all")}
        >
          <OrderStatusIcon type="all" />
          All
        </button>

        {tabsToShow.map((tab) => (
          <button
            type="button"
            key={tab.key}
            className={
              activeTab === tab.key ? "order-history-tab--active" : ""
            }
            onClick={() => setActiveTab(tab.key)}
          >
            <OrderStatusIcon type={tab.key} />
            {tab.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <p className="order-history-status">No orders in this category.</p>
      ) : (
        <div className="order-history-list">
          {filteredOrders.map((order) => (
            <Link
              to={`/orders/${order.id}`}
              key={order.id}
              className="order-history-card"
            >
              <div className="order-history-card__header">
                <div>
                  <p className="order-history-card__number">
                    Order #{order.orderNumber}
                  </p>

                  <p className="order-history-card__date">
                    {new Date(order.placedAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>

                <span
                  className={`order-history-card__status order-history-card__status--${order.status}`}
                >
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              <div className="order-history-card__items">
                {order.items.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className="order-history-card__item"
                  >
                    {item.productName} × {item.quantity}
                  </span>
                ))}

                {order.items.length > 3 && (
                  <span className="order-history-card__item">
                    +{order.items.length - 3} more
                  </span>
                )}
              </div>

              <div className="order-history-card__footer">
                <span>
                  {order.items.length} item
                  {order.items.length !== 1 ? "s" : ""}
                </span>

                <span className="order-history-card__total">
                  ₱{order.grandTotal}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;