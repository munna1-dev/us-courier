import { useCallback } from "react";
import type { MouseEvent } from "react";

interface AdminSidebarProps {
  activeView?: AdminView;
  onNavigate?: (view: AdminView) => void;
  className?: string;
}

export type AdminView =
  | "overview"
  | "shipments"
  | "users"
  | "couriers"
  | "facilities"
  | "tracking"
  | "reports"
  | "settings";

interface SidebarItem {
  label: string;
  view: AdminView;
  path: string;
  description?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    label: "Overview",
    view: "overview",
    path: "/admin",
    description: "Dashboard overview",
  },
  {
    label: "Shipments",
    view: "shipments",
    path: "/admin/shipments",
    description: "Manage shipments",
  },
  {
    label: "Users",
    view: "users",
    path: "/admin/users",
    description: "Manage user accounts",
  },
  {
    label: "Couriers",
    view: "couriers",
    path: "/admin/couriers",
    description: "Manage couriers",
  },
  {
    label: "Facilities",
    view: "facilities",
    path: "/admin/facilities",
    description: "Manage facilities",
  },
  {
    label: "Tracking",
    view: "tracking",
    path: "/admin/tracking",
    description: "Tracking operations",
  },
  {
    label: "Reports",
    view: "reports",
    path: "/admin/reports",
    description: "Operational reports",
  },
  {
    label: "Settings",
    view: "settings",
    path: "/admin/settings",
    description: "System settings",
  },
];

function normalizePath(path: string): string {
  const normalized = path.replace(/\/+$/, "");
  return normalized || "/";
}

function isCurrentPath(path: string): boolean {
  return (
    normalizePath(window.location.pathname) ===
    normalizePath(path)
  );
}

export default function AdminSidebar({
  activeView = "overview",
  onNavigate,
  className = "",
}: AdminSidebarProps) {
  const handleNavigation = useCallback(
    (
      event: MouseEvent<HTMLAnchorElement>,
      item: SidebarItem,
    ) => {
      event.preventDefault();

      if (isCurrentPath(item.path)) {
        return;
      }

      onNavigate?.(item.view);
    },
    [onNavigate],
  );

  return (
    <aside
      className={`admin-sidebar ${
        className
          ? `admin-sidebar--${className}`
          : ""
      }`.trim()}
      aria-label="Administrator sidebar"
    >
      <div className="admin-sidebar__inner">
        <div className="admin-sidebar__heading">
          <span className="admin-sidebar__eyebrow">
            Admin
          </span>

          <h2>Control Center</h2>
        </div>

        <nav
          className="admin-sidebar__nav"
          aria-label="Administrator sections"
        >
          <ul className="admin-sidebar__list">
            {sidebarItems.map((item) => {
              const isActive =
                activeView === item.view;

              return (
                <li
                  key={item.view}
                  className="admin-sidebar__item"
                >
                  <a
                    href={item.path}
                    className={`admin-sidebar__link ${
                      isActive
                        ? "admin-sidebar__link--active"
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
                    <span
                      className="admin-sidebar__icon"
                      aria-hidden="true"
                    >
                      {getIcon(item.view)}
                    </span>

                    <span className="admin-sidebar__link-content">
                      <span className="admin-sidebar__label">
                        {item.label}
                      </span>

                      {item.description && (
                        <span className="admin-sidebar__description">
                          {item.description}
                        </span>
                      )}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="admin-sidebar__footer">
          <a
            href="/dashboard"
            className="admin-sidebar__customer-link"
            onClick={(event) => {
              event.preventDefault();

              if (
                isCurrentPath(
                  "/dashboard",
                )
              ) {
                return;
              }

              window.history.pushState(
                {},
                "",
                "/dashboard",
              );

              window.dispatchEvent(
                new PopStateEvent(
                  "popstate",
                ),
              );
            }}
          >
            <span
              className="admin-sidebar__icon"
              aria-hidden="true"
            >
              ←
            </span>

            <span>
              Customer dashboard
            </span>
          </a>
        </div>
      </div>
    </aside>
  );
}

function getIcon(
  view: AdminView,
): string {
  switch (view) {
    case "overview":
      return "⌂";

    case "shipments":
      return "▣";

    case "users":
      return "◉";

    case "couriers":
      return "◇";

    case "facilities":
      return "⌖";

    case "tracking":
      return "◎";

    case "reports":
      return "▤";

    case "settings":
      return "⚙";

    default:
      return "•";
  }
}