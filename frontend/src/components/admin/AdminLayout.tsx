import {
  ReactNode,
  useCallback,
} from "react";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

import type { User } from "../../types";
import type { AdminView } from "./AdminSidebar";

interface AdminLayoutProps {
  user: User;
  activeView?: AdminView;
  onNavigate?: (view: AdminView) => void;
  onLogout?: () => void | Promise<void>;
  children: ReactNode;
  className?: string;
}

export default function AdminLayout({
  user,
  activeView = "overview",
  onNavigate,
  onLogout,
  children,
  className = "",
}: AdminLayoutProps) {
  const handleNavigate = useCallback(
    (view: AdminView) => {
      onNavigate?.(view);
    },
    [onNavigate],
  );

  const handleLogout = useCallback(
    async () => {
      await onLogout?.();
    },
    [onLogout],
  );

  return (
    <div
      className={`admin-layout ${
        className
          ? `admin-layout--${className}`
          : ""
      }`.trim()}
    >
      <AdminHeader
        user={user}
        activeView={activeView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <div className="admin-layout__body">
        <AdminSidebar
          activeView={activeView}
          onNavigate={handleNavigate}
        />

        <main className="admin-layout__main">
          <div className="page-shell admin-layout__content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}