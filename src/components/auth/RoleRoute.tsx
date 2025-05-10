import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RoleRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem("token");

  if (loading) return <div>Yükleniyor...</div>; // ✴️ Senkron tamamlanmadan geçme

  if (!token || !user) {
    return <Navigate to="/signin" />;
  }

  if (!allowedRoles.some(role => user.roles.includes(role))) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default RoleRoute;
