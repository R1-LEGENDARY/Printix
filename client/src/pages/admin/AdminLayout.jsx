import { NavLink, Outlet } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs";
import "./AdminLayout.css";

const adminIcons = {
  dashboard: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  products: <><path d="M4 8h16v12H4z" /><path d="m4 8 2-4h12l2 4M9 12h6" /></>,
  categories: <><path d="M4 5h16M4 12h16M4 19h16" /><path d="M7 5v14M17 5v14" /></>,
  orders: <><path d="M6 3h12v18H6z" /><path d="M9 7h6M9 11h6M9 15h4" /></>,
  reviews: <><path d="M4 5h16v12H8l-4 4z" /><path d="M8 9h8M8 13h5" /></>,
  coupons: <><path d="M4 7a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4h16v-4a2 2 0 0 1 0-4V7z" /><path d="M13 8v8" /></>,
  refunds: <><path d="M4 7v5h5" /><path d="M5 12a7 7 0 1 0 2-5" /></>,
  analytics: <><path d="M4 19V5M4 19h16" /><path d="m7 15 4-4 3 2 5-6" /></>,
};

function AdminIcon({ name }) {
  return <svg className="admin__nav-icon" viewBox="0 0 24 24" aria-hidden="true">{adminIcons[name]}</svg>;
}

function AdminLayout() {
  return (
    <div className="admin">
      <aside className="admin__sidebar" aria-label="Admin navigation">
        <h2>Printix Admin</h2>
        <nav>
          <NavLink to="/admin" end><AdminIcon name="dashboard" />Dashboard</NavLink>
          <NavLink to="/admin/products"><AdminIcon name="products" />Products</NavLink>
          <NavLink to="/admin/categories"><AdminIcon name="categories" />Categories</NavLink>
          <NavLink to="/admin/orders"><AdminIcon name="orders" />Orders</NavLink>
          <NavLink to="/admin/reviews"><AdminIcon name="reviews" />Reviews</NavLink>
          <NavLink to="/admin/coupons"><AdminIcon name="coupons" />Coupons</NavLink>
          <NavLink to="/admin/refunds"><AdminIcon name="refunds" />Refunds</NavLink>
          <NavLink to="/admin/analytics"><AdminIcon name="analytics" />Analytics</NavLink>
        </nav>
      </aside>
      <main className="admin__content" id="admin-content">
        <Breadcrumbs admin />
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;