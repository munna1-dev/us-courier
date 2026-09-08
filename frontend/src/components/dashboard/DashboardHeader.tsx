import { useCallback } from "react";
import type { MouseEvent } from "react";

import Button from "../common/Button";
import type { User } from "../../types";

type DashboardView =
  | "overview"
  | "shipments"
  | "shipment"
  | "profile"
  | "support";

interface DashboardHeaderProps {
  user: User;
  activeView?: DashboardView;
  onNavigate?: (view: DashboardView) => void;
  onLogout?: () => void | Promise<void>;
}

interface NavigationItem {
  label: string;
  view: DashboardView;
  path: string;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Overview",
    view: "overview",
    path: "/dashboard",
  },
  {
    label: "Shipments",
    view: "shipments",
    path: "/dashboard/shipments",
  },
  {
    label: "Profile",
    view: "profile",
    path: "/dashboard/profile",
  },
  {
    label: "Support",
    view: "support",
    path: "/dashboard/support",
  },
];

function getInitials(user: User): string {
  const first =
    user.first_name?.trim().charAt(0).toUpperCase() || "";

  const last =
    user.last_name?.trim().charAt(0).toUpperCase() || "";

  if (first || last) {
    return `${first}${last}`.slice(0, 2);
  }

  return user.email?.trim().charAt(0).toUpperCase() || "U";
}

function getDisplayName(user: User): string {
  const name = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user.email || "Customer";
}

export default function DashboardHeader({
  user,
  activeView = "overview",
  onNavigate,
  onLogout,
}: DashboardHeaderProps) {
  const handleNavigation = useCallback(
    (
      event: MouseEvent<HTMLAnchorElement>,
      item: NavigationItem,
    ) => {
      event.preventDefault();

      /*
       * CustomerDashboard owns browser history.
       * This component only reports the requested destination.
       */
      onNavigate?.(item.view);
    },
    [onNavigate],
  );

  const handleLogout = useCallback(async () => {
    await onLogout?.();
  }, [onLogout]);

  const displayName = getDisplayName(user);
  const initials = getInitials(user);

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__inner page-shell">
        <a
          className="dashboard-header__brand"
          href="/dashboard"
          onClick={(event) => {
            event.preventDefault();
            onNavigate?.("overview");
          }}
          aria-label="Dispatch Courier dashboard"
        >
          <span
            className="dashboard-header__brand-mark"
            aria-hidden="true"
          >
            DC
          </span>

          <span className="dashboard-header__brand-name">
            Dispatch Courier
          </span>
        </a>

        <nav
          className="dashboard-header__nav"
          aria-label="Customer dashboard navigation"
        >
          {navigationItems.map((item) => {
            const isActive = activeView === item.view;

            return (
              <a
                key={item.view}
                href={item.path}
                className={`dashboard-header__nav-link ${
                  isActive
                    ? "dashboard-header__nav-link--active"
                    : ""
                }`}
                aria-current={isActive ? "page" : undefined}
                onClick={(event) =>
                  handleNavigation(event, item)
                }
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="dashboard-header__account">
          <div
            className="dashboard-header__avatar"
            aria-hidden="true"
          >
            {initials}
          </div>

          <div className="dashboard-header__user">
            <span className="dashboard-header__user-name">
              {displayName}
            </span>

            <span className="dashboard-header__user-email">
              {user.email}
            </span>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={handleLogout}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}