import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">Printix</Link>
      <ul className="navbar__links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/catalog">Shop</Link></li>
        <li><Link to="/cart">Cart{cart.itemCount > 0 && ` (${cart.itemCount})`}</Link></li>

        {user ? (
          <>
            <li><Link to="/orders">Orders</Link></li>
            <li className="navbar__user">Hi, {user.name.split(" ")[0]}</li>
            <li>
              <button className="navbar__logout" onClick={handleLogout}>
                Log out
              </button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/register">Sign up</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;