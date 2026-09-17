import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser, loginWithGoogle } from "../api/auth";
import { useAuth } from "../context/useAuth";
import Button from "../components/Button";
import GoogleAuthButton from "../components/GoogleAuthButton";
import "./Auth.css";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const errors = {};
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address.";
    if (!form.password) errors.password = "Password is required.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setLoading(true);
    try {
      const data = await loginUser(form);
      login(data.user, data.token);
      const redirectTo = data.user.role === "admin" ? "/admin" : location.state?.from?.pathname || "/";
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
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
      navigate(data.user.role === "admin" ? "/admin" : location.state?.from?.pathname || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <h2>Welcome back</h2>
      <p>{location.state?.message || "Log in to continue designing."}</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={(e) => { handleChange(e); setFieldErrors((current) => ({ ...current, email: "" })); }} />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" value={form.password} onChange={(e) => { handleChange(e); setFieldErrors((current) => ({ ...current, password: "" })); }} />
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </div>

        {error && <p className="auth-error">{error}</p>}

        <Button type="submit" variant="primary" className="btn--block" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </Button>
        <p className="auth-forgot">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
      </form>

      <GoogleAuthButton action="log in" onSuccess={handleGoogleSuccess} onError={() => setError("Google sign-in failed.")} />

      <p className="auth-switch">
        Don't have an account? <Link to="/register">Sign up</Link>
      </p>
      <p className="auth-switch auth-guest">
        <Link to="/catalog">Continue as a guest</Link>
      </p>
    </div>
  );
}

export default Login;