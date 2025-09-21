// src/layout/AppLayout.tsx
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router-dom"; // ✅ DÜZELTİLDİ
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const LayoutContent: React.FC = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // 🔐 Offline token ise süresini kontrol etmeye gerek yok
    if (token === "offline-token") return;

    if (!token) {
      logout();
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp < now) {
        logout();
      }
    } catch {
      logout();
    }
  }, [user, logout]);

  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>

      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        {/* Sidebar fixed ise içerik üstte header ile çakışmasın diye padding veriyorsan koru */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet /> {/* ✅ Artık react-router-dom’dan, çocuk sayfalar render olur */}
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;