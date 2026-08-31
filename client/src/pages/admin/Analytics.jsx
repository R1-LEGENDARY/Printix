import { useEffect, useState } from "react";
import { getSalesAnalytics } from "../../api/admin";
import "./Dashboard.css";
import "./Analytics.css";

function Analytics() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    getSalesAnalytics(days).then(setData);
  }, [days]);

  if (!data) return <p className="admin-status">Loading analytics...</p>;

  const maxRevenue = Math.max(1, ...data.revenueTimeline.map((d) => d.revenue));

  return (
    <div>
      <div className="an-header">
        <h1>Sales analytics</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="dash-cards">
        <div className="dash-card">
          <span className="dash-card__label">Revenue ({days}d)</span>
          <span className="dash-card__value">₱{data.totalRevenue.toFixed(2)}</span>
        </div>
        <div className="dash-card">
          <span className="dash-card__label">Orders ({days}d)</span>
          <span className="dash-card__value">{data.totalOrders}</span>
        </div>
      </div>

      <h2 className="dash-section-title">Revenue timeline</h2>
      {data.revenueTimeline.length === 0 ? (
        <p className="admin-status">No paid orders in this period.</p>
      ) : (
        <div className="an-chart">
          {data.revenueTimeline.map((d) => (
            <div key={d.date} className="an-bar-wrap" title={`${d.date}: ₱${d.revenue.toFixed(2)}`}>
              <div className="an-bar" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }} />
              <span className="an-bar-label">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="dash-section-title">Best-selling products</h2>
      {data.bestSellers.length === 0 ? (
        <p className="admin-status">No sales in this period.</p>
      ) : (
        <table className="dash-table">
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
      )}

      <h2 className="dash-section-title">Low stock</h2>
      {data.lowStock.length === 0 ? (
        <p className="admin-status">Nothing running low.</p>
      ) : (
        <table className="dash-table">
          <thead><tr><th>Product</th><th>Variant</th><th>SKU</th><th>Stock</th></tr></thead>
          <tbody>
            {data.lowStock.map((v) => (
              <tr key={v.id}>
                <td>{v.productName}</td>
                <td>{v.color} / {v.size}</td>
                <td>{v.sku}</td>
                <td className={v.stockQuantity === 0 ? "an-out-of-stock" : ""}>{v.stockQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Analytics;