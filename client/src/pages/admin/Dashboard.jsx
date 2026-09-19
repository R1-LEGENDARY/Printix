import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMetrics } from "../../api/admin";
import "./Dashboard.css";

function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMetrics().then(setMetrics).catch((err) => setError(err.response?.data?.message || err.message));
  }, []);

  if (error) return <p className="admin-error">{error}</p>;
  if (!metrics) return <p className="admin-status">Loading metrics...</p>;

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="dashboard-cards">
        <article className="dashboard-card">
          <span className="dashboard-card__label">Total revenue</span>
          <span className="dashboard-card__value">₱{metrics.totalRevenue}</span>
        </article>
        <article className="dashboard-card">
          <span className="dashboard-card__label">Total orders</span>
          <span className="dashboard-card__value">{metrics.totalOrders}</span>
        </article>
        <article className="dashboard-card">
          <span className="dashboard-card__label">Pending orders</span>
          <span className="dashboard-card__value">{metrics.pendingOrders}</span>
        </article>
        <article className="dashboard-card">
          <span className="dashboard-card__label">Active products</span>
          <span className="dashboard-card__value">{metrics.totalProducts}</span>
        </article>
        <article className="dashboard-card">
          <span className="dashboard-card__label">Customers</span>
          <span className="dashboard-card__value">{metrics.totalCustomers}</span>
        </article>
        <article className="dashboard-card dashboard-card--warn">
          <span className="dashboard-card__label">Low stock variants</span>
          <span className="dashboard-card__value">{metrics.lowStockVariants}</span>
        </article>
      </div>

      <h2 className="dashboard-section-title">Recent orders</h2>
      {metrics.recentOrders.length === 0 ? (
        <p className="admin-status">No orders yet.</p>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                  <td>{o.customerName}</td>
                  <td><span className={`status-pill status-pill--${o.status}`}>{o.status}</span></td>
                  <td>₱{o.grandTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;