import { useEffect, useState } from "react";
import { getSalesAnalytics } from "../../api/admin";
import "./Dashboard.css";
import "./Analytics.css";

function Analytics() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSalesAnalytics(days).then(setData).catch((err) => setError(err.response?.data?.message || err.message));
  }, [days]);

  if (error) return <p className="admin-error">{error}</p>;
  if (!data) return <p className="admin-status">Loading analytics...</p>;

  const maxRevenue = Math.max(1, ...data.revenueTimeline.map((d) => d.revenue));

  return (
    <div>
      <div className="analytics-header">
        <h1>Sales analytics</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="dashboard-cards">
        <article className="dashboard-card">
          <span className="dashboard-card__label">Revenue ({days}d)</span>
          <span className="dashboard-card__value">₱{data.totalRevenue.toFixed(2)}</span>
        </article>
        <article className="dashboard-card">
          <span className="dashboard-card__label">Orders ({days}d)</span>
          <span className="dashboard-card__value">{data.totalOrders}</span>
        </article>
      </div>

      <h2 className="dashboard-section-title">Revenue timeline</h2>
      {data.revenueTimeline.length === 0 ? (
        <p className="admin-status">No paid orders in this period.</p>
      ) : (
        <div className="analytics-chart">
          <div className="analytics-chart__plot">
            {data.revenueTimeline.map((d) => (
              <div key={d.date} className="analytics-bar-wrap" title={`${d.date}: ₱${d.revenue.toFixed(2)}`}>
                <span className="analytics-bar-value">₱{d.revenue.toFixed(0)}</span>
                <div className="analytics-bar-area">
                  <div className="analytics-bar" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }} />
                </div>
                <span className="analytics-bar-label">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="dashboard-section-title">Best-selling products</h2>
      {data.bestSellers.length === 0 ? (
        <p className="admin-status">No sales in this period.</p>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead><tr><th>Product</th><th>Units sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {data.bestSellers.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.quantitySold}</td>
                  <td>₱{p.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="dashboard-section-title">Low stock</h2>
      {data.lowStock.length === 0 ? (
        <p className="admin-status">Nothing running low.</p>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead><tr><th>Product</th><th>Variant</th><th>SKU</th><th>Stock</th></tr></thead>
            <tbody>
              {data.lowStock.map((v) => (
                <tr key={v.id}>
                  <td>{v.productName}</td>
                  <td>{v.color} / {v.size}</td>
                  <td>{v.sku}</td>
                  <td className={v.stockQuantity === 0 ? "analytics-out-of-stock" : ""}>{v.stockQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Analytics;