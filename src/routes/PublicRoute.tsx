import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

export default function PublicRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/" replace /> : children;
}