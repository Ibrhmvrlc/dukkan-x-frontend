import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext"; // eklemeyi unutma

export default function PublicRoute({ children }: { children: ReactNode }) {
  const { authenticated, loading } = useAuth();

  if (loading) return <div>Yükleniyor...</div>;

  if (authenticated) return <Navigate to="/" replace />;

  return children;
}
