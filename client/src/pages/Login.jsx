import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import "./Auth.css";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
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

  return (
    <div className="auth">
      <h2>Welcome back</h2>
      <p>{location.state?.message || "Log in to continue designing."}</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
        </div>

        {error && <p className="auth-error">{error}</p>}

        <Button type="submit" variant="primary" className="btn--block" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="auth-switch">
        Don't have an account? <Link to="/register">Sign up</Link>
      </p>
      <p className="auth-switch">
        <Link to="/catalog">Continue browsing as guest →</Link>
      </p>
    </div>
  );
}

export default Login;