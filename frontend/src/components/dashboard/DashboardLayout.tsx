import {
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import DashboardHeader from "./DashboardHeader";
import PublicFooter from "../layout/PublicFooter";
import type { User } from "../../types";

type DashboardView =
  | "overview"
  | "shipments"
  | "shipment"
  | "profile"
  | "support";

interface DashboardLayoutProps {
  user: User;
  activeView?: DashboardView;
  onNavigate?: (view: DashboardView) => void;
  onLogout?: () => void | Promise<void>;
  children: ReactNode;
  className?: string;
}

function getViewFromPath(): DashboardView {
  const path =
    window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/dashboard/shipments") {
    return "shipments";
  }

  if (path.startsWith("/dashboard/shipments/")) {
    return "shipment";
  }

  if (path === "/dashboard/profile") {
    return "profile";
  }

  if (path === "/dashboard/support") {
    return "support";
  }

  return "overview";
}

export default function DashboardLayout({
  user,
  activeView = "overview",
  onNavigate,
  onLogout,
  children,
  className = "",
}: DashboardLayoutProps) {
  const [currentView, setCurrentView] =
    useState<DashboardView>(
      getViewFromPath() || activeView,
    );

  /*
   * Synchronize the layout with browser Back/Forward.
   *
   * This listener never creates a history entry.
   */
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getViewFromPath());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  /*
   * App/CustomerDashboard remains responsible for the actual route.
   * DashboardLayout only forwards the selected view.
   */
  useEffect(() => {
    setCurrentView(activeView);
  }, [activeView]);

  const handleNavigate = useCallback(
    (view: DashboardView) => {
      setCurrentView(view);
      onNavigate?.(view);
    },
    [onNavigate],
  );

  const handleLogout = useCallback(async () => {
    await onLogout?.();
  }, [onLogout]);

  return (
    <div
      className={`dashboard-layout ${
        className ? `dashboard-layout--${className}` : ""
      }`.trim()}
    >
      <DashboardHeader
        user={user}
        activeView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <main className="dashboard-layout__main">
        <div className="page-shell dashboard-layout__content">
          {children}
        </div>
      </main>

      <footer className="dashboard-layout__footer">
        <PublicFooter />
      </footer>
    </div>
  );
}