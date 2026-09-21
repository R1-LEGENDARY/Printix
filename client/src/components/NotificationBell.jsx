import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./NotificationBell.css";

const statusMessages = {
  order_pending: "is awaiting payment",
  order_paid: "has been paid and is ready for processing",
  order_processing: "is now being prepared",
  order_printing: "is now being printed",
  order_shipped: "is on the way",
  order_delivered: "has been delivered",
  order_cancelled: "has been cancelled",
  order_refunded: "has been refunded",
};

function getNotificationMessage(notification) {
  const statusMessage = statusMessages[notification.type];
  if (!statusMessage) return notification.message;

  const orderNumber = notification.message.match(/#(PRX-[\w-]+)/)?.[1];
  return orderNumber
    ? `Your order #${orderNumber} ${statusMessage}.`
    : `Your order ${statusMessage}.`;
}

function NotificationBell({ open, onToggle, onClose }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!open) return undefined;

    const scrollY = window.scrollY;
    const previousBodyPosition = document.body.style.position;
    const previousOverflow = document.body.style.overflow;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;
    const previousRootOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.overflow = "hidden";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.documentElement.style.overflow = previousRootOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.overflow = previousOverflow;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    async function fetchNotifications() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await api.get("/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      } catch {
        return;
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function markRead(notification) {
    if (!notification.readAt) {
      const token = localStorage.getItem("token");
      await api.patch(
        `/notifications/${notification.id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    if (notification.relatedType === "order" && notification.relatedId) {
      onClose();
      navigate(`/orders/${notification.relatedId}`);
    }
  }

  async function markAllRead() {
    const token = localStorage.getItem("token");
    await api.patch(
      "/notifications/read-all",
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt || new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
  }

  return (
    <div className="notification-bell">
      <button
        type="button"
        className="notification-bell__button"
        onClick={onToggle}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-bell__count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="notification-bell__empty">No notifications yet.</p>
          ) : (
            <div className="notification-bell__list">
              {notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`notification-bell__item ${notification.readAt ? "" : "notification-bell__item--unread"}`}
                  onClick={() => markRead(notification)}
                >
                  <span>{getNotificationMessage(notification)}</span>
                  <small>
                    {new Date(notification.createdAt).toLocaleString(
                      undefined,
                      {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      },
                    )}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
