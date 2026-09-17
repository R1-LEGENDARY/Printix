import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import AccountMenu from "./AccountMenu";
import NotificationBell from "./NotificationBell";
import "./Navbar.css";

function Navbar() {
  const { user, previewingAsCustomer } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const searchRef = useRef(null);

  const isAdminMode = user?.role === "admin" && !previewingAsCustomer;
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  function close() {
    setMobileOpen(false);
  }

  function submitSearch(e) {
    e.preventDefault();
    navigate(`/catalog${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`);
    setSearchOpen(false);
    close();
  }

  function handleSearchChange(value) {
    setSearch(value);
    navigate(`/catalog${value.trim() ? `?search=${encodeURIComponent(value.trim())}` : ""}`, { replace: true });
  }

  useEffect(() => {
    if (!searchOpen) return undefined;
    function closeOnOutsideClick(e) {
      if (!searchRef.current?.contains(e.target)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [searchOpen]);

  return (
    <nav className={`navbar ${isAdminMode ? "navbar--admin" : ""}`}>
      <Link to={isAdminMode ? "/admin" : "/"} className="navbar__brand" onClick={close}>
        Printix
      </Link>

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
            {user && (
              <>
                <li><Link to="/cart" className={location.pathname === "/cart" ? "navbar__link--active" : ""} onClick={close}>Cart{cart.itemCount > 0 && ` (${cart.itemCount})`}</Link></li>
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
      <div className="navbar__tools">
        {!isAuthPage && location.pathname.startsWith("/catalog") && (
          <div className="navbar__search" ref={searchRef}>
            {searchOpen ? (
              <form className="navbar__search-form" onSubmit={submitSearch}>
                <input autoFocus type="search" value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search" aria-label="Search products" />
                <button type="submit" aria-label="Submit search">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.2 4.2" /></svg>
                </button>
              </form>
            ) : (
              <button className="navbar__search-trigger" type="button" onClick={() => setSearchOpen(true)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.2 4.2" /></svg>
                <span>Search</span>
              </button>
            )}
          </div>
        )}
        {user && (
          <div className="navbar__account">
            {!isAdminMode && <NotificationBell />}
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
            <AccountMenu />
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;