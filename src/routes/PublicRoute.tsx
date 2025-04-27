import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/" replace /> : children;
}