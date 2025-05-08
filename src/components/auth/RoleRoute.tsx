import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RoleRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Yükleniyor...</div>;
  if (!user) return <Navigate to="/signin" />;
  if (!allowedRoles.some(role => user.roles.includes(role))) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default RoleRoute;
