import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginWithGoogle, registerUser } from "../api/auth";
import { useAuth } from "../context/useAuth";
import Button from "../components/Button";
import GoogleAuthButton from "../components/GoogleAuthButton";
import "./Auth.css";

function Register() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmation: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required.";
    if (!form.lastName.trim()) errors.lastName = "Last name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address.";
    if (!form.password) errors.password = "Password is required.";
    else if (form.password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (!form.confirmation) errors.confirmation = "Please confirm your password.";
    else if (form.password !== form.confirmation) errors.confirmation = "Passwords do not match.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setLoading(true);
    try {
      await registerUser({ name: `${form.firstName.trim()} ${form.lastName.trim()}`, email: form.email, password: form.password });
      navigate("/login", { state: { message: "Account created. You can log in now." } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(response) {
    setError(null);
    setLoading(true);
    try {
      const data = await loginWithGoogle(response.credential);
      login(data.user, data.token);
      navigate(data.user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth auth--register">
      <h2>Create your account</h2>
      <p>Start designing your own custom merch.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-name-fields">
          <div className="field">
            <label htmlFor="first-name">First name</label>
            <input id="first-name" name="firstName" type="text" value={form.firstName} onChange={(e) => { handleChange(e); setFieldErrors((current) => ({ ...current, firstName: "" })); }} />
            {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
          </div>
          <div className="field">
            <label htmlFor="last-name">Last name</label>
            <input id="last-name" name="lastName" type="text" value={form.lastName} onChange={(e) => { handleChange(e); setFieldErrors((current) => ({ ...current, lastName: "" })); }} />
            {fieldErrors.lastName && <span className="field-error">{fieldErrors.lastName}</span>}
          </div>
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={(e) => { handleChange(e); setFieldErrors((current) => ({ ...current, email: "" })); }} />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input id="password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => { handleChange(e); setFieldErrors((current) => ({ ...current, password: "" })); }} />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>
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
          <label htmlFor="confirmation">Confirm password</label>
          <div className="password-field">
            <input id="confirmation" name="confirmation" type={showConfirmation ? "text" : "password"} value={form.confirmation} onChange={(e) => { handleChange(e); setFieldErrors((current) => ({ ...current, confirmation: "" })); }} />
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

        <Button type="submit" variant="primary" className="btn--block" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
        <p className="auth-forgot">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
      </form>

      <GoogleAuthButton action="sign up" onSuccess={handleGoogleSuccess} onError={() => setError("Google sign-up failed.")} />

      <p className="auth-switch">
        Already have analytics account? <Link to="/login">Log in</Link>
      </p>
      <p className="auth-switch auth-guest">
        <Link to="/catalog">Continue as a guest</Link>
      </p>
    </div>
  );
}

export default Register;