import {
  useEffect,
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

export default function AdminPage() {
  const [user, setUser] =
    useState<User | null>(null);

  const [summary, setSummary] =
    useState<AdminSummary | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function load() {
      try {
        const [
          admin,
          dashboard,
        ] = await Promise.all([
          getAdminMe(),
          getAdminDashboard(),
        ]);

        setUser(admin);

        setSummary(
          dashboard as AdminSummary
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load admin dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="page-shell loading-state">
          Loading administration...
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
              Administration
            </p>

            <h1>
              Operations dashboard
            </h1>

            {user && (
              <p className="muted">
                Signed in as{" "}
                {user.email}
              </p>
            )}
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
          <a
            href="/admin/users"
            className="admin-menu__item"
          >
            <strong>
              Users
            </strong>

            <span>
              Manage customer and
              administrative accounts.
            </span>
          </a>

          <a
            href="/admin/couriers"
            className="admin-menu__item"
          >
            <strong>
              Couriers
            </strong>

            <span>
              Manage courier personnel
              and assignments.
            </span>
          </a>

          <a
            href="/admin/facilities"
            className="admin-menu__item"
          >
            <strong>
              Facilities
            </strong>

            <span>
              Manage operational
              facilities.
            </span>
          </a>

          <a
            href="/admin/shipments"
            className="admin-menu__item"
          >
            <strong>
              Shipments
            </strong>

            <span>
              Create, update, dispatch,
              and track shipments.
            </span>
          </a>

          <a
            href="/admin/settings"
            className="admin-menu__item"
          >
            <strong>
              Settings
            </strong>

            <span>
              Configure application
              preferences.
            </span>
          </a>
        </section>
      </div>
    </main>
  );
}