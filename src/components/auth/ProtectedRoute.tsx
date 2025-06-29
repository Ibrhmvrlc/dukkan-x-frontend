import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-6">Yükleniyor...</div>;
  }

  // ⚠️ Authenticated false olursa yönlendir
  if (!authenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}