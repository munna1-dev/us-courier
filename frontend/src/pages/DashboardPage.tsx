import {
  useEffect,
  useState,
} from "react";

import Alert from "../components/common/Alert";
import Button from "../components/common/Button";

import {
  getCustomerDashboard,
  getCustomerShipments,
} from "../lib/api";

import {
  useAuth,
} from "../hooks/useAuth";

import type {
  Shipment,
} from "../types";

interface DashboardData {
  total?: number | string;
  in_transit?: number | string;
  inTransit?: number | string;
  delivered?: number | string;
}

export default function DashboardPage() {
  const {
    user,
    loading: authLoading,
    signOut,
  } = useAuth();

  const [
    shipments,
    setShipments,
  ] = useState<Shipment[]>([]);

  const [
    dashboard,
    setDashboard,
  ] = useState<DashboardData | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      window.location.href = "/login";
      return;
    }

    async function load() {
      setLoading(true);

      try {
        const [
          summary,
          customerShipments,
        ] = await Promise.all([
          getCustomerDashboard(),
          getCustomerShipments(),
        ]);

        setDashboard(
          summary as DashboardData
        );

        setShipments(
          customerShipments
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [
    user,
    authLoading,
  ]);

  async function handleSignOut() {
    await signOut();

    window.location.href = "/";
  }

  const name =
    user?.first_name ??
    user?.firstName ??
    "Customer";

  return (
    <main className="dashboard-page">
      <div className="page-shell">
        <div className="dashboard-header">
          <div>
            <p className="page-eyebrow">
              Customer dashboard
            </p>

            <h1>
              Welcome, {name}
            </h1>
          </div>

          <Button
            variant="secondary"
            onClick={
              handleSignOut
            }
          >
            Sign out
          </Button>
        </div>

        {error && (
          <Alert
            variant="error"
            title="Dashboard error"
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="loading-state">
            Loading dashboard...
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <span>
                  Total shipments
                </span>

                <strong>
                  {Number(
                    dashboard?.total ??
                      shipments.length
                  )}
                </strong>
              </div>

              <div className="stat-card">
                <span>
                  In transit
                </span>

                <strong>
                  {Number(
                    dashboard?.in_transit ??
                      dashboard?.inTransit ??
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
                    dashboard?.delivered ??
                      0
                  )}
                </strong>
              </div>
            </div>

            <section className="dashboard-section">
              <div className="section-heading">
                <h2>
                  Your shipments
                </h2>
              </div>

              {shipments.length ===
              0 ? (
                <div className="empty-state">
                  <h3>
                    No shipments yet
                  </h3>

                  <p>
                    Your shipment
                    activity will appear
                    here.
                  </p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          Tracking
                        </th>

                        <th>
                          Recipient
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Created
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {shipments.map(
                        (shipment) => (
                          <tr
                            key={
                              shipment.id
                            }
                          >
                            <td>
                              <a
                                href={`/tracking?tracking=${encodeURIComponent(
                                  shipment.tracking_number
                                )}`}
                              >
                                {
                                  shipment.tracking_number
                                }
                              </a>
                            </td>

                            <td>
                              {shipment.recipient_name ??
                                shipment.recipientName ??
                                "—"}
                            </td>

                            <td>
                              {shipment.status.replace(
                                /_/g,
                                " "
                              )}
                            </td>

                            <td>
                              {shipment.created_at
                                ? new Date(
                                    shipment.created_at
                                  ).toLocaleDateString()
                                : "—"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}