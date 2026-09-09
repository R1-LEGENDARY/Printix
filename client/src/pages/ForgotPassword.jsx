import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";
import Button from "../components/Button";
import "./Auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setFieldError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setFieldError("");
    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to request a reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <h2>Reset your password</h2>
      <p>Enter your email and we will send a password reset link.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="reset-email">Email</label>
          <input id="reset-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldError(""); }} />
          {fieldError && <span className="field-error">{fieldError}</span>}
        </div>
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}
        <Button type="submit" variant="primary" className="btn--block" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <p className="auth-switch"><Link to="/login">Back to log in</Link></p>
    </div>
  );
}

export default ForgotPassword;
