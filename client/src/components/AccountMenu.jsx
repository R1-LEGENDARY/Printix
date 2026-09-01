import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AccountMenu.css";

function AccountMenu() {
  const { user, logout, previewingAsCustomer, startPreview, exitPreview } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!user) return null;

  function handleLogout() {
    setOpen(false);
    logout();
    navigate("/");
  }

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        className="account-menu__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </svg>
      </button>

      {open && (
        <div className="account-menu__dropdown" role="menu">
          <div className="account-menu__user">
            <span className="account-menu__name">{user.name}</span>
            <span className="account-menu__email">{user.email}</span>
          </div>

          {user.role === "admin" && !previewingAsCustomer && (
            <button
              className="account-menu__link"
              onClick={() => {
                startPreview();
                setOpen(false);
                navigate("/");
              }}
            >
              Preview as customer
            </button>
          )}

          {user.role === "admin" && previewingAsCustomer && (
            <button
              className="account-menu__link account-menu__link--exit"
              onClick={() => {
                exitPreview();
                setOpen(false);
                navigate("/admin");
              }}
            >
              Exit customer preview
            </button>
          )}

          <Link to="/profile" className="account-menu__link" onClick={() => setOpen(false)}>
            Profile / Settings
          </Link>

          <button className="account-menu__link account-menu__link--logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountMenu;