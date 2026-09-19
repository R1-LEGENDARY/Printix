import { Link, useLocation } from "react-router-dom";
import "./Breadcrumbs.css";

function titleize(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/*
 * DOCU: Builds the customer-facing breadcrumb trail from the current URL.
 * @param {string} pathname - Current browser pathname
 * @returns {Array<Object>} - Breadcrumb labels and optional destination paths
 */
function getCustomerItems(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const [section, value] = segments;
  const items = [{ label: "Home", to: "/" }];

  if (section === "catalog") items.push({ label: "Shop", to: "/catalog" });
  if (section === "products") {
    items.push({ label: "Shop", to: "/catalog" });
    if (value) items.push({ label: titleize(value) });
  } else if (section === "design") {
    items.push({ label: "Shop", to: "/catalog" });
    if (value) items.push({ label: titleize(value), to: `/products/${value}` });
    items.push({ label: "Design" });
  } else if (section === "orders") {
    items.push({ label: "Orders", to: "/orders" });
    if (value) items.push({ label: "Order details" });
  } else {
    const labels = {
      cart: "Cart",
      wishlist: "Wishlist",
      profile: "Profile",
      checkout: "Checkout",
      login: "Log in",
      register: "Sign up",
      "forgot-password": "Forgot password",
      "reset-password": "Reset password",
    };
    if (labels[section]) items.push({ label: labels[section] });
  }

  return items;
}

/*
 * DOCU: Builds the admin breadcrumb trail for list, create, and detail routes.
 * @param {string} pathname - Current admin pathname
 * @returns {Array<Object>} - Breadcrumb labels and optional destination paths
 */
function getAdminItems(pathname) {
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const section = segments[0];
  const value = segments[1];
  const labels = {
    products: "Products",
    categories: "Categories",
    orders: "Orders",
    reviews: "Reviews",
    coupons: "Coupons",
    refunds: "Refunds",
    analytics: "Analytics",
  };

  if (!section) return [{ label: "Admin" }];

  const items = [{ label: "Admin", to: "/admin" }, { label: labels[section] || titleize(section) }];
  if (section === "products" && value === "new") {
    items[1] = { label: "Products", to: "/admin/products" };
    items.push({ label: "Add product" });
  }
  if (section === "products" && value && value !== "new") items.push({ label: "Edit product" });
  if (section === "orders" && value) items.push({ label: "Order details" });
  return items;
}

/*
 * DOCU: Renders the breadcrumb navigation for the current customer or admin route.
 * @param {boolean} admin - Whether to render the admin breadcrumb variant
 * @returns {JSX.Element|null} - Breadcrumb navigation or nothing for the other route family
 */
function Breadcrumbs({ admin = false }) {
  const { pathname } = useLocation();
  const isAdminPath = pathname.startsWith("/admin");
  if (admin !== isAdminPath) return null;

  const items = admin ? getAdminItems(pathname) : getCustomerItems(pathname);

  if (items.length === 0) return null;

  return (
    <nav className={`breadcrumbs ${admin ? "breadcrumbs--admin" : ""}`} aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {index > 0 && <span className="breadcrumbs__separator" aria-hidden="true">›</span>}
              {item.to && !isCurrent ? <Link to={item.to}>{item.label}</Link> : <span aria-current={isCurrent ? "page" : undefined}>{item.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
