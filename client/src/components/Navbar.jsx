import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import AccountMenu from "./AccountMenu";
import "./Navbar.css";

function Navbar() {
  const { user, previewingAsCustomer } = useAuth();
  const { cart } = useCart();
  const location = useLocation();

  const isAdminMode = user?.role === "admin" && !previewingAsCustomer;
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <nav className="navbar">
      <Link to={isAdminMode ? "/admin" : "/"} className="navbar__brand">Printix</Link>

      <ul className="navbar__links">
        {isAdminMode || isAuthPage ? null : (
          <>
            <li><Link to="/" className={location.pathname === "/" ? "navbar__link--active" : ""}>Home</Link></li>
            <li><Link to="/catalog" className={location.pathname.startsWith("/catalog") ? "navbar__link--active" : ""}>Shop</Link></li>
            <li><Link to="/cart" className={location.pathname === "/cart" ? "navbar__link--active" : ""}>Cart{cart.itemCount > 0 && ` (${cart.itemCount})`}</Link></li>
            {user && (
              <>
                <li><Link to="/orders" className={location.pathname === "/orders" ? "navbar__link--active" : ""}>Orders</Link></li>
                <li><Link to="/wishlist" className={location.pathname === "/wishlist" ? "navbar__link--active" : ""}>Wishlist</Link></li>
              </>
            )}
          </>
        )}

        {user ? (
          <li><AccountMenu /></li>
        ) : (
          <>
            <li><Link to="/login" className={location.pathname === "/login" ? "navbar__link--active" : ""}>Log in</Link></li>
            <li><Link to="/register" className={location.pathname === "/register" ? "navbar__link--active" : ""}>Sign up</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;