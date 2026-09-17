import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="route-status">Loading...</p>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location, message: "Please log in to continue." }} replace />;
  }

  return children;
}

export default ProtectedRoute;