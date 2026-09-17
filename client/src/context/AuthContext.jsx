import { useEffect, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "./AuthContextValue";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));
  const [previewingAsCustomer, setPreviewingAsCustomer] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    api
      .get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function login(user, token) {
    localStorage.setItem("token", token);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setPreviewingAsCustomer(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        previewingAsCustomer,
        startPreview: () => setPreviewingAsCustomer(true),
        exitPreview: () => setPreviewingAsCustomer(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

