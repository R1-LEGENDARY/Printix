import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAdminOrders } from "../../api/admin";
import "./Dashboard.css";

const statuses = ["", "pending", "paid", "processing", "printing", "shipped", "delivered", "cancelled", "refunded"];

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setLoading(true);
      return listAdminOrders(statusFilter || undefined)
        .then(setOrders)
        .catch((err) => setError(err.response?.data?.message || err.message))
        .finally(() => setLoading(false));
    });
  }, [statusFilter]);

  return (
    <div>
      <h1>Orders</h1>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-filter-select">
        {statuses.map((s) => (
          <option key={s} value={s}>{s ? s[0].toUpperCase() + s.slice(1) : "All statuses"}</option>
        ))}
      </select>

      {loading ? (
        <p className="admin-status">Loading orders...</p>
      ) : error ? (
        <p className="admin-error">{error}</p>
      ) : orders.length === 0 ? (
        <p className="admin-status">No orders found.</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                  <td>{o.customer.name}</td>
                  <td><span className={`status-pill status-pill--${o.status}`}>{o.status}</span></td>
                  <td>₱{o.grandTotal}</td>
                  <td>{new Date(o.placedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OrderList;