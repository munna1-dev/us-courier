import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Alert from "../components/common/Alert";

import {
  getAdminDashboard,
  getAdminMe,
} from "../lib/api";

import type {
  User,
} from "../types";

interface AdminSummary {
  total?: number | string;
  in_transit?: number | string;
  inTransit?: number | string;
  delivered?: number | string;
}

type ManagementRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "courier"
  | "support"
  | "viewer"
  | "customer"
  | string;

interface ManagementUser
  extends User {
  role?: string;
  user_role?: string;
  userRole?: string;
  status?: string;
  account_status?: string;
  accountStatus?: string;
}

interface AdminMenuItem {
  title: string;
  description: string;
  href: string;
  permission: string;
}

const MENU_ITEMS: AdminMenuItem[] = [
  {
    title: "Users",
    description:
      "Manage customer and administrative accounts.",
    href: "/admin/users",
    permission: "user.read",
  },
  {
    title: "Couriers",
    description:
      "Manage courier personnel and assignments.",
    href: "/admin/couriers",
    permission: "operations.manage",
  },
  {
    title: "Facilities",
    description:
      "Manage operational facilities.",
    href: "/admin/facilities",
    permission: "operations.manage",
  },
  {
    title: "Shipments",
    description:
      "Create, update, dispatch, and track shipments.",
    href: "/admin/shipments",
    permission: "shipment.read",
  },
  {
    title: "Tracking",
    description:
      "Review shipment tracking and movement history.",
    href: "/admin/tracking",
    permission: "tracking.read",
  },
  {
    title: "Reports",
    description:
      "Review operational shipment reports.",
    href: "/admin/reports",
    permission: "report.read",
  },
  {
    title: "Settings",
    description:
      "Configure application and operational settings.",
    href: "/admin/settings",
    permission: "settings.manage",
  },
];

const ROLE_PERMISSIONS: Record<
  string,
  string[]
> = {
  super_admin: ["*"],

  admin: [
    "shipment.read",
    "shipment.create",
    "shipment.update",
    "shipment.delete",
    "shipment.dispatch",
    "user.read",
    "user.create",
    "user.update",
    "operations.manage",
    "tracking.read",
    "report.read",
    "audit.read",
  ],

  manager: [
    "shipment.read",
    "shipment.create",
    "shipment.update",
    "shipment.dispatch",
    "tracking.read",
    "report.read",
  ],

  courier: [
    "shipment.read",
    "shipment.dispatch",
  ],

  support: [
    "tracking.read",
  ],

  viewer: [
    "tracking.read",
    "report.read",
  ],

  customer: [],
};

function getRole(
  user: ManagementUser | null
): ManagementRole {
  const role =
    user?.role ??
    user?.user_role ??
    user?.userRole;

  return typeof role === "string"
    ? role.toLowerCase()
    : "customer";
}

function getRoleLabel(
  role: ManagementRole
): string {
  switch (role) {
    case "super_admin":
      return "Super Admin";

    case "admin":
      return "Administrator";

    case "manager":
      return "Manager";

    case "courier":
      return "Courier";

    case "support":
      return "Support";

    case "viewer":
      return "Viewer";

    default:
      return "Customer";
  }
}

function hasPermission(
  role: ManagementRole,
  permission: string
): boolean {
  const permissions =
    ROLE_PERMISSIONS[
      role
    ] || [];

  return (
    permissions.includes("*") ||
    permissions.includes(
      permission
    )
  );
}

export default function AdminPage() {
  const [user, setUser] =
    useState<ManagementUser | null>(
      null
    );

  const [summary, setSummary] =
    useState<AdminSummary | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [
          admin,
          dashboard,
        ] = await Promise.all([
          getAdminMe(),
          getAdminDashboard(),
        ]);

        if (!mounted) {
          return;
        }

        setUser(
          admin as ManagementUser
        );

        setSummary(
          dashboard as AdminSummary
        );
      } catch (caught) {
        if (!mounted) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load admin dashboard."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const role =
    useMemo(
      () => getRole(user),
      [user]
    );

  const roleLabel =
    getRoleLabel(role);

  const visibleMenuItems =
    useMemo(
      () =>
        MENU_ITEMS.filter(
          (item) =>
            hasPermission(
              role,
              item.permission
            )
        ),
      [role]
    );

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="page-shell loading-state">
          Loading administration...
        </div>
      </main>
    );
  }

  if (
    !user ||
    role === "customer"
  ) {
    return (
      <main className="dashboard-page">
        <div className="page-shell">
          <Alert
            variant="error"
            title="Management access denied"
          >
            Your account is not authorized
            to access the management portal.
          </Alert>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="page-shell">
        <div className="dashboard-header">
          <div>
            <p className="page-eyebrow">
              Secure management
            </p>

            <h1>
              {role ===
              "super_admin"
                ? "Super Admin Portal"
                : "Operations dashboard"}
            </h1>

            <p className="muted">
              Signed in as{" "}
              {user.email}
              {" · "}
              {roleLabel}
            </p>
          </div>
        </div>

        {error && (
          <Alert
            variant="error"
            title="Administration error"
          >
            {error}
          </Alert>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <span>
              Shipments
            </span>

            <strong>
              {Number(
                summary?.total ?? 0
              )}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              In transit
            </span>

            <strong>
              {Number(
                summary?.in_transit ??
                  summary?.inTransit ??
                  0
              )}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Delivered
            </span>

            <strong>
              {Number(
                summary?.delivered ?? 0
              )}
            </strong>
          </div>
        </div>

        <section className="admin-menu">
          {visibleMenuItems.map(
            (item) => (
              <a
                key={item.href}
                href={item.href}
                className="admin-menu__item"
              >
                <strong>
                  {item.title}
                </strong>

                <span>
                  {item.description}
                </span>
              </a>
            )
          )}
        </section>

        {visibleMenuItems.length ===
          0 && (
          <Alert
            variant="info"
            title="No management modules available"
          >
            Your assigned role does not
            currently have access to any
            management modules.
          </Alert>
        )}
      </div>
    </main>
  );
}