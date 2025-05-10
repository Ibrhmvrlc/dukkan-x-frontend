import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const token = localStorage.getItem("token");

  if (loading) return <div>Yükleniyor...</div>; // ✴️ Sayfa yüklenmesin

  if (!token || !user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
