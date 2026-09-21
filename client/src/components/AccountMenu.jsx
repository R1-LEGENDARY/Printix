import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./AccountMenu.css";

function AccountMenu({ open, onToggle, onClose }) {
  const { user, logout, previewingAsCustomer, startPreview, exitPreview } =
    useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return false;
  });
  const menuRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light",
    );
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  if (!user) return null;

  function handleLogout() {
    onClose();
    logout();
    navigate("/");
  }

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        className="account-menu__trigger"
        onClick={onToggle}
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
                onClose();
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
                onClose();
                navigate("/admin");
              }}
            >
              Exit customer preview
            </button>
          )}

          <Link to="/profile" className="account-menu__link" onClick={onClose}>
            Profile / Settings
          </Link>

          <div className="account-menu__theme-row">
            <span className="account-menu__theme-label">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {darkMode ? (
                  <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </>
                )}
              </svg>
              <span>{darkMode ? "Dark mode" : "Light mode"}</span>
            </span>
            <button
              className={`account-menu__switch ${darkMode ? "account-menu__switch--on" : ""}`}
              type="button"
              role="switch"
              aria-checked={darkMode}
              aria-label={`Turn ${darkMode ? "off" : "on"} dark mode`}
              onClick={() => setDarkMode((current) => !current)}
            >
              <span className="account-menu__switch-thumb" />
            </button>
          </div>

          <button
            className="account-menu__link account-menu__link--logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountMenu;
