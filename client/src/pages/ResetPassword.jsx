import { useState } from "react";
import { Link } from "react-router-dom";
import { resetPassword } from "../api/auth";
import Button from "../components/Button";
import "./Auth.css";

function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const errors = {};
    if (!password) errors.password = "Password is required.";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (!confirmation) errors.confirmation = "Please confirm your password.";
    else if (password !== confirmation) errors.confirmation = "Passwords do not match.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setLoading(true);
    try {
      const result = await resetPassword(token, password);
      setMessage(result.message);
      setPassword("");
      setConfirmation("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="auth">
        <h2>Invalid reset link</h2>
        <p className="auth-error">This password reset link is missing its token.</p>
        <p className="auth-switch"><Link to="/forgot-password">Request a new link</Link></p>
      </div>
    );
  }

  return (
    <div className="auth">
      <h2>Choose a new password</h2>
      <p>Use at least 8 characters for your new password.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="new-password">New password</label>
          <div className="password-field">
            <input id="new-password" type={showPassword ? "text" : "password"} minLength={8} value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors((current) => ({ ...current, password: "" })); }} />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide new password" : "Show new password"}>
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
                  <path d="M9.1 5.5A11 11 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-4.3 5.5" />
                  <path d="M6.2 6.2A16.5 16.5 0 0 0 2 12s3.5 7 10 7a11.5 11.5 0 0 0 5.8-1.8" />
                </svg>
              )}
            </button>
          </div>
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </div>
        <div className="field">
          <label htmlFor="confirm-password">Confirm password</label>
          <div className="password-field">
            <input id="confirm-password" type={showConfirmation ? "text" : "password"} minLength={8} value={confirmation} onChange={(e) => { setConfirmation(e.target.value); setFieldErrors((current) => ({ ...current, confirmation: "" })); }} />
            <button type="button" className="password-toggle" onClick={() => setShowConfirmation((current) => !current)} aria-label={showConfirmation ? "Hide confirmation password" : "Show confirmation password"}>
              {showConfirmation ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
                  <path d="M9.1 5.5A11 11 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-4.3 5.5" />
                  <path d="M6.2 6.2A16.5 16.5 0 0 0 2 12s3.5 7 10 7a11.5 11.5 0 0 0 5.8-1.8" />
                </svg>
              )}
            </button>
          </div>
          {fieldErrors.confirmation && <span className="field-error">{fieldErrors.confirmation}</span>}
        </div>
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}
        <Button type="submit" variant="primary" className="btn--block" disabled={loading || !!message}>
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>
      <p className="auth-switch"><Link to="/login">Back to log in</Link></p>
    </div>
  );
}

export default ResetPassword;
