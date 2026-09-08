import { useCallback } from "react";
import type { MouseEvent } from "react";

import Button from "../common/Button";
import type { User } from "../../types";

type AdminView =
  | "overview"
  | "shipments"
  | "users"
  | "couriers"
  | "facilities"
  | "tracking"
  | "reports"
  | "settings";

interface AdminHeaderProps {
  user: User;
  activeView?: AdminView;
  onNavigate?: (view: AdminView) => void;
  onLogout?: () => void | Promise<void>;
  className?: string;
}

interface NavigationItem {
  label: string;
  view: AdminView;
  path: string;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Overview",
    view: "overview",
    path: "/admin",
  },
  {
    label: "Shipments",
    view: "shipments",
    path: "/admin/shipments",
  },
  {
    label: "Users",
    view: "users",
    path: "/admin/users",
  },
  {
    label: "Couriers",
    view: "couriers",
    path: "/admin/couriers",
  },
  {
    label: "Facilities",
    view: "facilities",
    path: "/admin/facilities",
  },
];

function getDisplayName(user: User): string {
  const name = [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user.email || "Administrator";
}

function getInitials(user: User): string {
  const first =
    user.first_name
      ?.trim()
      .charAt(0)
      .toUpperCase() || "";

  const last =
    user.last_name
      ?.trim()
      .charAt(0)
      .toUpperCase() || "";

  if (first || last) {
    return `${first}${last}`.slice(0, 2);
  }

  return (
    user.email
      ?.trim()
      .charAt(0)
      .toUpperCase() || "A"
  );
}

function normalizePath(path: string): string {
  const normalized =
    path.replace(/\/+$/, "");

  return normalized || "/";
}

function isCurrentPath(path: string): boolean {
  return (
    normalizePath(
      window.location.pathname,
    ) === normalizePath(path)
  );
}

export default function AdminHeader({
  user,
  activeView = "overview",
  onNavigate,
  onLogout,
  className = "",
}: AdminHeaderProps) {
  const handleNavigation = useCallback(
    (
      event: MouseEvent<HTMLAnchorElement>,
      item: NavigationItem,
    ) => {
      event.preventDefault();

      if (
        isCurrentPath(item.path)
      ) {
        return;
      }

      onNavigate?.(item.view);
    },
    [onNavigate],
  );

  const handleBrandClick =
    useCallback(
      (
        event: MouseEvent<HTMLAnchorElement>,
      ) => {
        event.preventDefault();

        if (
          isCurrentPath("/admin")
        ) {
          return;
        }

        onNavigate?.("overview");
      },
      [onNavigate],
    );

  const handleLogout =
    useCallback(async () => {
      await onLogout?.();
    }, [onLogout]);

  const displayName =
    getDisplayName(user);

  const initials =
    getInitials(user);

  return (
    <header
      className={`admin-header ${
        className
          ? `admin-header--${className}`
          : ""
      }`.trim()}
    >
      <div className="admin-header__inner page-shell">
        <a
          href="/admin"
          className="admin-header__brand"
          onClick={handleBrandClick}
          aria-label="Dispatch Courier admin dashboard"
        >
          <span
            className="admin-header__brand-mark"
            aria-hidden="true"
          >
            DC
          </span>

          <span className="admin-header__brand-text">
            <span className="admin-header__brand-name">
              Dispatch Courier
            </span>

            <span className="admin-header__brand-label">
              Administration
            </span>
          </span>
        </a>

        <nav
          className="admin-header__nav"
          aria-label="Administrator navigation"
        >
          {navigationItems.map(
            (item) => {
              const isActive =
                activeView ===
                item.view;

              return (
                <a
                  key={item.view}
                  href={item.path}
                  className={`admin-header__nav-link ${
                    isActive
                      ? "admin-header__nav-link--active"
                      : ""
                  }`.trim()}
                  aria-current={
                    isActive
                      ? "page"
                      : undefined
                  }
                  onClick={(event) =>
                    handleNavigation(
                      event,
                      item,
                    )
                  }
                >
                  {item.label}
                </a>
              );
            },
          )}
        </nav>

        <div className="admin-header__account">
          <div
            className="admin-header__avatar"
            aria-hidden="true"
          >
            {initials}
          </div>

          <div className="admin-header__user">
            <span className="admin-header__user-name">
              {displayName}
            </span>

            <span className="admin-header__user-email">
              {user.email ||
                "Administrator"}
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