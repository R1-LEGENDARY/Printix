import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import AccountMenu from "./AccountMenu";
import "./Navbar.css";

function Navbar() {
  const { user, previewingAsCustomer } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdminMode = user?.role === "admin" && !previewingAsCustomer;
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  function close() {
    setMobileOpen(false);
  }

  return (
    <nav className={`navbar ${isAdminMode ? "navbar--admin" : ""}`}>
      <Link to={isAdminMode ? "/admin" : "/"} className="navbar__brand" onClick={close}>
        Printix
      </Link>

      {!isAuthPage && (
        <button
          className="navbar__burger"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span />
          <span />
          <span />
        </button>
      )}

      <ul className={`navbar__links ${mobileOpen ? "navbar__links--open" : ""}`}>
        {isAuthPage ? null : isAdminMode ? (
          <>
            <li><Link to="/admin" className={location.pathname === "/admin" ? "navbar__link--active" : ""} onClick={close}>Dashboard</Link></li>
            <li><Link to="/admin/products" className={location.pathname.startsWith("/admin/products") ? "navbar__link--active" : ""} onClick={close}>Products</Link></li>
            <li><Link to="/admin/categories" className={location.pathname.startsWith("/admin/categories") ? "navbar__link--active" : ""} onClick={close}>Categories</Link></li>
            <li><Link to="/admin/orders" className={location.pathname.startsWith("/admin/orders") ? "navbar__link--active" : ""} onClick={close}>Orders</Link></li>
            <li><Link to="/admin/reviews" className={location.pathname.startsWith("/admin/reviews") ? "navbar__link--active" : ""} onClick={close}>Reviews</Link></li>
            <li><Link to="/admin/analytics" className={location.pathname.startsWith("/admin/analytics") ? "navbar__link--active" : ""} onClick={close}>Analytics</Link></li>
            <li><Link to="/admin/coupons" className={location.pathname.startsWith("/admin/coupons") ? "navbar__link--active" : ""} onClick={close}>Coupons</Link></li>
            <li><Link to="/admin/refunds" className={location.pathname.startsWith("/admin/refunds") ? "navbar__link--active" : ""} onClick={close}>Refunds</Link></li>
          </>
        ) : (
          <>
            <li><Link to="/" className={location.pathname === "/" ? "navbar__link--active" : ""} onClick={close}>Home</Link></li>
            <li><Link to="/catalog" className={location.pathname.startsWith("/catalog") ? "navbar__link--active" : ""} onClick={close}>Shop</Link></li>
            <li><Link to="/cart" className={location.pathname === "/cart" ? "navbar__link--active" : ""} onClick={close}>Cart{cart.itemCount > 0 && ` (${cart.itemCount})`}</Link></li>
            {user && (
              <>
                <li><Link to="/orders" className={location.pathname === "/orders" ? "navbar__link--active" : ""} onClick={close}>Orders</Link></li>
                <li><Link to="/wishlist" className={location.pathname === "/wishlist" ? "navbar__link--active" : ""} onClick={close}>Wishlist</Link></li>
              </>
            )}
          </>
        )}

        {!user && !isAuthPage ? (
          <>
            <li><Link to="/login" onClick={close}>Log in</Link></li>
            <li><Link to="/register" onClick={close}>Sign up</Link></li>
          </>
        ) : null}
      </ul>
      {user && <div className="navbar__account"><AccountMenu /></div>}
    </nav>
  );
}

export default Navbar;