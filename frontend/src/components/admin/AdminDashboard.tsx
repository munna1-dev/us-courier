import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type { MouseEvent } from "react";

import AdminLayout from "./AdminLayout";
import AdminStats from "./AdminStats";
import AdminShipmentTable from "./AdminShipmentTable";
import LoadingScreen from "../common/LoadingScreen";
import Alert from "../common/Alert";
import Button from "../common/Button";

import {
  getAdminSummary,
  getShipments,
} from "../../lib/api";

import {
  getAuthUser,
  getUserRole,
  signOut,
} from "../../lib/auth";

import type {
  AdminDashboardSummary,
  Shipment,
  User,
} from "../../types";

interface AdminDashboardProps {
  className?: string;
}

interface SummaryShape
  extends AdminDashboardSummary {
  total_shipments?: number;
  totalShipments?: number;
  total?: number;

  pending_shipments?: number;
  pendingShipments?: number;
  pending?: number;

  in_transit?: number;
  inTransit?: number;
  in_transit_shipments?: number;

  delivered?: number;
  delivered_shipments?: number;
  deliveredShipments?: number;

  total_users?: number;
  totalUsers?: number;
  users?: number;

  active_users?: number;
  activeUsers?: number;

  total_couriers?: number;
  totalCouriers?: number;
  couriers?: number;
}

const ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "super_admin",
  "superadmin",
]);

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
}

function readNumber(
  source: SummaryShape | null,
  ...keys: string[]
): number {
  if (!source) return 0;

  for (const key of keys) {
    const value =
      source[
        key as keyof SummaryShape
      ];

    if (typeof value === "number") {
      return value;
    }

    if (
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function extractSummary(
  response: unknown,
): SummaryShape | null {
  if (
    !response ||
    typeof response !== "object"
  ) {
    return null;
  }

  const value =
    response as Record<
      string,
      unknown
    >;

  if (
    value.data &&
    typeof value.data === "object" &&
    !Array.isArray(value.data)
  ) {
    const data =
      value.data as Record<
        string,
        unknown
      >;

    if (
      data.summary &&
      typeof data.summary === "object" &&
      !Array.isArray(data.summary)
    ) {
      return data.summary as SummaryShape;
    }

    return data as SummaryShape;
  }

  if (
    value.summary &&
    typeof value.summary === "object" &&
    !Array.isArray(value.summary)
  ) {
    return value.summary as SummaryShape;
  }

  return value as SummaryShape;
}

function extractShipments(
  response: unknown,
): Shipment[] {
  if (
    !response ||
    typeof response !== "object"
  ) {
    return [];
  }

  const value =
    response as Record<
      string,
      unknown
    >;

  if (Array.isArray(value.data)) {
    return value.data as Shipment[];
  }

  if (
    Array.isArray(value.shipments)
  ) {
    return value.shipments as Shipment[];
  }

  if (
    value.data &&
    typeof value.data === "object" &&
    !Array.isArray(value.data)
  ) {
    const data =
      value.data as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(data.shipments)
    ) {
      return data.shipments as Shipment[];
    }
  }

  return [];
}

function normalizeRole(
  role?: string | null,
): string {
  return (
    role
      ?.trim()
      .toLowerCase()
      .replace(/[-\s]+/g, "_") ||
    ""
  );
}

function getDisplayName(
  user: User,
): string {
  const name = [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    name ||
    user.email ||
    "Administrator"
  );
}

function getShipmentPath(
  shipment: Shipment,
): string {
  const identifier =
    shipment.id ||
    shipment.tracking_number;

  if (!identifier) {
    return "/admin/shipments";
  }

  return `/admin/shipments/${encodeURIComponent(
    identifier,
  )}`;
}

export default function AdminDashboard({
  className = "",
}: AdminDashboardProps) {
  const [user, setUser] =
    useState<User | null>(null);

  const [summary, setSummary] =
    useState<SummaryShape | null>(
      null,
    );

  const [shipments, setShipments] =
    useState<Shipment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [accessDenied, setAccessDenied] =
    useState(false);

  const loadDashboard =
    useCallback(
      async (refresh = false) => {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const authUser =
            await getAuthUser();

          if (!authUser) {
            setAccessDenied(true);
            return;
          }

          const role =
            normalizeRole(
              getUserRole(authUser),
            );

          if (!ADMIN_ROLES.has(role)) {
            setUser(
              authUser as User,
            );
            setAccessDenied(true);
            return;
          }

          setUser(
            authUser as User,
          );
          setAccessDenied(false);

          const [
            summaryResult,
            shipmentsResult,
          ] = await Promise.allSettled([
            getAdminSummary(),
            getShipments({
              page: 1,
              limit: 10,
            }),
          ]);

          const failures: string[] =
            [];

          if (
            summaryResult.status ===
            "fulfilled"
          ) {
            setSummary(
              extractSummary(
                summaryResult.value,
              ),
            );
          } else {
            failures.push(
              getErrorMessage(
                summaryResult.reason,
                "Unable to load administrator statistics.",
              ),
            );
          }

          if (
            shipmentsResult.status ===
            "fulfilled"
          ) {
            setShipments(
              extractShipments(
                shipmentsResult.value,
              ),
            );
          } else {
            failures.push(
              getErrorMessage(
                shipmentsResult.reason,
                "Unable to load recent shipments.",
              ),
            );
          }

          if (failures.length) {
            setError(
              failures.join(" "),
            );
          }
        } catch (err: unknown) {
          setError(
            getErrorMessage(
              err,
              "Unable to load the administrator dashboard.",
            ),
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    document.title =
      "Admin Dashboard — Dispatch Courier";
  }, []);

  const navigate =
    useCallback(
      (
        event: MouseEvent<HTMLAnchorElement>,
        path: string,
      ) => {
        event.preventDefault();

        const currentPath =
          window.location.pathname.replace(
            /\/+$/,
            "",
          ) || "/";

        const nextPath =
          path.replace(/\/+$/, "") || "/";

        if (
          currentPath === nextPath
        ) {
          return;
        }

        window.history.pushState(
          {},
          "",
          nextPath,
        );

        window.dispatchEvent(
          new PopStateEvent(
            "popstate",
          ),
        );
      },
      [],
    );

  const handleLogout =
    useCallback(async () => {
      try {
        await signOut();
      } finally {
        const currentPath =
          window.location.pathname;

        if (currentPath !== "/login") {
          window.history.replaceState(
            {},
            "",
            "/login",
          );

          window.dispatchEvent(
            new PopStateEvent(
              "popstate",
            ),
          );
        }
      }
    }, []);

  const handleRefresh =
    useCallback(() => {
      void loadDashboard(true);
    }, [loadDashboard]);

  const handleShipmentSelect =
    useCallback(
      (shipment: Shipment) => {
        const path =
          getShipmentPath(shipment);

        const currentPath =
          window.location.pathname.replace(
            /\/+$/,
            "",
          ) || "/";

        if (
          currentPath === path
        ) {
          return;
        }

        window.history.pushState(
          {},
          "",
          path,
        );

        window.dispatchEvent(
          new PopStateEvent(
            "popstate",
          ),
        );
      },
      [],
    );

  if (loading) {
    return (
      <LoadingScreen
        message="Loading administrator dashboard..."
        fullScreen
      />
    );
  }

  if (accessDenied) {
    return (
      <div
        className={`protected-page ${
          className
            ? `protected-page--${className}`
            : ""
        }`.trim()}
      >
        <div className="page-shell">
          <div className="protected-placeholder">
            <Alert
              variant="error"
              title="Administrator access required"
            >
              You do not have permission
              to access the administrator
              dashboard.
            </Alert>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.history.replaceState(
                  {},
                  "",
                  "/login",
                );

                window.dispatchEvent(
                  new PopStateEvent(
                    "popstate",
                  ),
                );
              }}
            >
              Return to sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoadingScreen
        message="Checking administrator access..."
        fullScreen
      />
    );
  }

  const totalShipments =
    readNumber(
      summary,
      "total_shipments",
      "totalShipments",
      "total",
    );

  const pending =
    readNumber(
      summary,
      "pending_shipments",
      "pendingShipments",
      "pending",
    );

  const inTransit =
    readNumber(
      summary,
      "in_transit",
      "inTransit",
      "in_transit_shipments",
    );

  const delivered =
    readNumber(
      summary,
      "delivered",
      "delivered_shipments",
      "deliveredShipments",
    );

  const totalUsers =
    readNumber(
      summary,
      "total_users",
      "totalUsers",
      "users",
    );

  const activeUsers =
    readNumber(
      summary,
      "active_users",
      "activeUsers",
    );

  const totalCouriers =
    readNumber(
      summary,
      "total_couriers",
      "totalCouriers",
      "couriers",
    );

  return (
    <AdminLayout
      user={user}
      activeView="overview"
      onLogout={handleLogout}
      className={className}
    >
      <div className="admin-dashboard">
        <div className="page-heading">
          <div>
            <span className="page-heading__eyebrow">
              Administration
            </span>

            <h1>
              Admin Dashboard
            </h1>

            <p>
              Welcome back,{" "}
              {getDisplayName(user)}.
              Monitor shipments, users,
              couriers, and operations.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleRefresh}
            loading={refreshing}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </div>

        {error && (
          <Alert
            variant="warning"
            title="Some dashboard information is unavailable"
          >
            {error}
          </Alert>
        )}

        <AdminStats
          totalShipments={
            totalShipments
          }
          pendingShipments={pending}
          inTransitShipments={
            inTransit
          }
          deliveredShipments={
            delivered
          }
          totalUsers={totalUsers}
          activeUsers={activeUsers}
          totalCouriers={
            totalCouriers
          }
        />

        <section className="admin-dashboard__actions">
          <div className="dashboard-section__header">
            <div>
              <h2>
                Quick actions
              </h2>

              <p>
                Manage core Dispatch
                Courier operations.
              </p>
            </div>
          </div>

          <div className="quick-actions__grid">
            <a
              href="/admin/shipments"
              className="quick-actions__item"
              onClick={(event) =>
                navigate(
                  event,
                  "/admin/shipments",
                )
              }
            >
              <span className="quick-actions__content">
                <span className="quick-actions__label">
                  Manage shipments
                </span>

                <span className="quick-actions__description">
                  Review, create, and
                  update shipments.
                </span>
              </span>

              <span
                className="quick-actions__arrow"
                aria-hidden="true"
              >
                →
              </span>
            </a>

            <a
              href="/admin/users"
              className="quick-actions__item"
              onClick={(event) =>
                navigate(
                  event,
                  "/admin/users",
                )
              }
            >
              <span className="quick-actions__content">
                <span className="quick-actions__label">
                  Manage users
                </span>

                <span className="quick-actions__description">
                  Review customer and
                  staff accounts.
                </span>
              </span>

              <span
                className="quick-actions__arrow"
                aria-hidden="true"
              >
                →
              </span>
            </a>

            <a
              href="/admin/couriers"
              className="quick-actions__item"
              onClick={(event) =>
                navigate(
                  event,
                  "/admin/couriers",
                )
              }
            >
              <span className="quick-actions__content">
                <span className="quick-actions__label">
                  Manage couriers
                </span>

                <span className="quick-actions__description">
                  Review courier
                  assignments and status.
                </span>
              </span>

              <span
                className="quick-actions__arrow"
                aria-hidden="true"
              >
                →
              </span>
            </a>

            <a
              href="/admin/facilities"
              className="quick-actions__item"
              onClick={(event) =>
                navigate(
                  event,
                  "/admin/facilities",
                )
              }
            >
              <span className="quick-actions__content">
                <span className="quick-actions__label">
                  Manage facilities
                </span>

                <span className="quick-actions__description">
                  Review facilities and
                  operational locations.
                </span>
              </span>

              <span
                className="quick-actions__arrow"
                aria-hidden="true"
              >
                →
              </span>
            </a>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section__header">
            <div>
              <h2>
                Recent shipments
              </h2>

              <p>
                Latest shipment activity
                across the network.
              </p>
            </div>

            <a
              href="/admin/shipments"
              className="button button--ghost"
              onClick={(event) =>
                navigate(
                  event,
                  "/admin/shipments",
                )
              }
            >
              View all
            </a>
          </div>

          {shipments.length > 0 ? (
            <AdminShipmentTable
              shipments={shipments}
              onSelect={
                handleShipmentSelect
              }
            />
          ) : (
            <div className="dashboard-section__empty">
              <Alert
                variant="info"
                title="No recent shipments"
              >
                No shipments are currently
                available for the dashboard.
              </Alert>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}