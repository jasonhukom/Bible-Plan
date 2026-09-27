import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading, isConfigured } = useAuth();

  if (!isConfigured) return children; // let pages render their own "not configured" message
  if (loading) return <div className="reader-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
