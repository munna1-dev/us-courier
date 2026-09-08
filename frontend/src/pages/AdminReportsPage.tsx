import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import LoadingScreen from "../components/common/LoadingScreen";
import StatusBadge from "../components/common/StatusBadge";
import {
  getAdminSummary,
  getCouriers,
  getFacilities,
  getShipments,
  getUsers,
} from "../lib/api";
import type {
  Courier,
  Facility,
  Shipment,
  User,
} from "../types";

interface AdminReportsPageProps {
  className?: string;
}

interface ReportData {
  shipments: Shipment[];
  users: User[];
  couriers: Courier[];
  facilities: Facility[];
  totalShipments: number;
  totalUsers: number;
  totalCouriers: number;
  totalFacilities: number;
}

interface LoadResult<T> {
  value: T;
  error?: string;
}

function getArray<T>(
  value: unknown,
): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const object =
      value as Record<
        string,
        unknown
      >;

    const candidates = [
      object.items,
      object.results,
      object.records,
      object.shipments,
      object.users,
      object.couriers,
      object.facilities,
      object.data,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate as T[];
      }
    }
  }

  return [];
}

function getNumber(
  value: unknown,
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed =
      Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function getStatusCount(
  shipments: Shipment[],
  statuses: string[],
): number {
  const allowed =
    new Set(
      statuses.map((status) =>
        status.toLowerCase(),
      ),
    );

  return shipments.filter(
    (shipment) =>
      allowed.has(
        String(
          shipment.status ?? "",
        ).toLowerCase(),
      ),
  ).length;
}

function formatNumber(
  value: number,
): string {
  return new Intl.NumberFormat(
    undefined,
  ).format(value);
}

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

async function loadSafely<T>(
  request: () => Promise<T>,
  label: string,
): Promise<LoadResult<T>> {
  try {
    return {
      value: await request(),
    };
  } catch (error) {
    return {
      value: null as T,
      error:
        error instanceof Error
          ? `${label}: ${error.message}`
          : `${label}: request failed.`,
    };
  }
}

export default function AdminReportsPage({
  className = "",
}: AdminReportsPageProps) {
  const [report, setReport] =
    useState<ReportData | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [warnings, setWarnings] =
    useState<string[]>([]);

  const loadReport =
    useCallback(async () => {
      setLoading(true);
      setError("");
      setWarnings([]);

      try {
        const [
          summaryResult,
          shipmentsResult,
          usersResult,
          couriersResult,
          facilitiesResult,
        ] = await Promise.all([
          loadSafely(
            getAdminSummary,
            "Dashboard summary",
          ),
          loadSafely(
            () =>
              getShipments({
                page: 1,
                limit: 1000,
              }),
            "Shipments",
          ),
          loadSafely(
            () =>
              getUsers({
                page: 1,
                limit: 1000,
              }),
            "Users",
          ),
          loadSafely(
            () =>
              getCouriers({
                page: 1,
                limit: 1000,
              }),
            "Couriers",
          ),
          loadSafely(
            () =>
              getFacilities({
                page: 1,
                limit: 1000,
              }),
            "Facilities",
          ),
        ]);

        const nextWarnings =
          [
            summaryResult.error,
            shipmentsResult.error,
            usersResult.error,
            couriersResult.error,
            facilitiesResult.error,
          ].filter(
            (
              item,
            ): item is string =>
              Boolean(item),
          );

        const shipments =
          getArray<Shipment>(
            shipmentsResult.value,
          );

        const users =
          getArray<User>(
            usersResult.value,
          );

        const couriers =
          getArray<Courier>(
            couriersResult.value,
          );

        const facilities =
          getArray<Facility>(
            facilitiesResult.value,
          );

        const summaryRoot =
          summaryResult.value &&
          typeof summaryResult.value ===
            "object"
            ? (
                summaryResult.value as Record<
                  string,
                  unknown
                >
              )
            : {};

        const summaryData =
          summaryRoot.data &&
          typeof summaryRoot.data ===
            "object"
            ? (
                summaryRoot.data as Record<
                  string,
                  unknown
                >
              )
            : summaryRoot;

        const totalShipments =
          getNumber(
            summaryData.total_shipments ??
              summaryData.totalShipments,
          ) ||
          shipments.length;

        const totalUsers =
          getNumber(
            summaryData.total_users ??
              summaryData.totalUsers,
          ) ||
          users.length;

        const totalCouriers =
          getNumber(
            summaryData.total_couriers ??
              summaryData.totalCouriers,
          ) ||
          couriers.length;

        const totalFacilities =
          getNumber(
            summaryData.total_facilities ??
              summaryData.totalFacilities,
          ) ||
          facilities.length;

        const anyData =
          shipments.length > 0 ||
          users.length > 0 ||
          couriers.length > 0 ||
          facilities.length > 0 ||
          totalShipments > 0 ||
          totalUsers > 0 ||
          totalCouriers > 0 ||
          totalFacilities > 0;

        if (
          !anyData &&
          nextWarnings.length === 5
        ) {
          throw new Error(
            "Unable to load the report data. All report sources failed.",
          );
        }

        setReport({
          shipments,
          users,
          couriers,
          facilities,
          totalShipments,
          totalUsers,
          totalCouriers,
          totalFacilities,
        });

        setWarnings(
          nextWarnings,
        );
      } catch (loadError) {
        setReport(null);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load report data.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    document.title =
      "Reports — Dispatch Courier";

    void loadReport();
  }, [loadReport]);

  const metrics = useMemo(() => {
    const shipments =
      report?.shipments ?? [];

    const couriers =
      report?.couriers ?? [];

    const facilities =
      report?.facilities ?? [];

    return {
      delivered:
        getStatusCount(
          shipments,
          ["delivered"],
        ),

      inTransit:
        getStatusCount(
          shipments,
          [
            "in_transit",
            "in transit",
          ],
        ),

      pending:
        getStatusCount(
          shipments,
          ["pending"],
        ),

      outForDelivery:
        getStatusCount(
          shipments,
          [
            "out_for_delivery",
            "out for delivery",
          ],
        ),

      cancelled:
        getStatusCount(
          shipments,
          [
            "cancelled",
            "canceled",
          ],
        ),

      activeCouriers:
        couriers.filter(
          (courier) =>
            courier.is_active !== false,
        ).length,

      activeFacilities:
        facilities.filter(
          (facility) =>
            facility.is_active !== false,
        ).length,
    };
  }, [report]);

  if (loading && !report) {
    return (
      <section
        className={`admin-reports-page ${className}`.trim()}
      >
        <LoadingScreen
          message="Preparing operational reports..."
        />
      </section>
    );
  }

  return (
    <section
      className={`admin-reports-page ${className}`.trim()}
    >
      <div className="page-heading">
        <div>
          <h1>Reports</h1>
          <p>
            Review shipment performance and
            courier network activity.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          loading={loading}
          onClick={() =>
            void loadReport()
          }
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Report unavailable"
          dismissible
          onDismiss={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert
          variant="warning"
          title="Some report data could not be loaded"
        >
          <ul>
            {warnings.map(
              (warning) => (
                <li
                  key={warning}
                >
                  {warning}
                </li>
              ),
            )}
          </ul>
        </Alert>
      )}

      {!report ? (
        <EmptyState
          title="No report data"
          description="There is currently no report data available."
          action={
            <Button
              type="button"
              variant="primary"
              onClick={() =>
                void loadReport()
              }
            >
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-card__label">
                Total shipments
              </span>
              <strong className="stat-card__value">
                {formatNumber(
                  report.totalShipments,
                )}
              </strong>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">
                Delivered
              </span>
              <strong className="stat-card__value">
                {formatNumber(
                  metrics.delivered,
                )}
              </strong>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">
                In transit
              </span>
              <strong className="stat-card__value">
                {formatNumber(
                  metrics.inTransit,
                )}
              </strong>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">
                Pending
              </span>
              <strong className="stat-card__value">
                {formatNumber(
                  metrics.pending,
                )}
              </strong>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">
                Out for delivery
              </span>
              <strong className="stat-card__value">
                {formatNumber(
                  metrics.outForDelivery,
                )}
              </strong>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">
                Cancelled
              </span>
              <strong className="stat-card__value">
                {formatNumber(
                  metrics.cancelled,
                )}
              </strong>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">
                Active couriers
              </span>
              <strong className="stat-card__value">
                {formatNumber(
                  metrics.activeCouriers,
                )}
              </strong>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">
                Active facilities
              </span>
              <strong className="stat-card__value">
                {formatNumber(
                  metrics.activeFacilities,
                )}
              </strong>
            </div>
          </div>

          <div className="admin-report-grid">
            <section className="card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    Shipment performance
                  </span>
                  <h2>
                    Current shipment status
                  </h2>
                </div>
              </div>

              <div className="report-status-list">
                <div className="report-status-row">
                  <span>
                    Delivered
                  </span>
                  <strong>
                    {formatNumber(
                      metrics.delivered,
                    )}
                  </strong>
                </div>

                <div className="report-status-row">
                  <span>
                    In transit
                  </span>
                  <strong>
                    {formatNumber(
                      metrics.inTransit,
                    )}
                  </strong>
                </div>

                <div className="report-status-row">
                  <span>
                    Pending
                  </span>
                  <strong>
                    {formatNumber(
                      metrics.pending,
                    )}
                  </strong>
                </div>

                <div className="report-status-row">
                  <span>
                    Out for delivery
                  </span>
                  <strong>
                    {formatNumber(
                      metrics.outForDelivery,
                    )}
                  </strong>
                </div>

                <div className="report-status-row">
                  <span>
                    Cancelled
                  </span>
                  <strong>
                    {formatNumber(
                      metrics.cancelled,
                    )}
                  </strong>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    Network overview
                  </span>
                  <h2>
                    Operational resources
                  </h2>
                </div>
              </div>

              <div className="report-status-list">
                <div className="report-status-row">
                  <span>
                    Total users
                  </span>
                  <strong>
                    {formatNumber(
                      report.totalUsers,
                    )}
                  </strong>
                </div>

                <div className="report-status-row">
                  <span>
                    Total couriers
                  </span>
                  <strong>
                    {formatNumber(
                      report.totalCouriers,
                    )}
                  </strong>
                </div>

                <div className="report-status-row">
                  <span>
                    Active couriers
                  </span>
                  <strong>
                    {formatNumber(
                      metrics.activeCouriers,
                    )}
                  </strong>
                </div>

                <div className="report-status-row">
                  <span>
                    Total facilities
                  </span>
                  <strong>
                    {formatNumber(
                      report.totalFacilities,
                    )}
                  </strong>
                </div>

                <div className="report-status-row">
                  <span>
                    Active facilities
                  </span>
                  <strong>
                    {formatNumber(
                      metrics.activeFacilities,
                    )}
                  </strong>
                </div>
              </div>
            </section>
          </div>

          <section className="card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  Recent shipments
                </span>
                <h2>
                  Latest shipment activity
                </h2>
              </div>
            </div>

            {report.shipments.length ===
            0 ? (
              <EmptyState
                title="No shipments"
                description="There are no shipments available for this report."
              />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>
                        Tracking
                      </th>
                      <th>
                        Route
                      </th>
                      <th>
                        Status
                      </th>
                      <th>
                        Created
                      </th>
                      <th>
                        Updated
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.shipments
                      .slice(0, 20)
                      .map(
                        (
                          shipment,
                          index,
                        ) => (
                          <tr
                            key={
                              shipment.id ||
                              shipment.tracking_number ||
                              index
                            }
                          >
                            <td>
                              <strong>
                                {
                                  shipment.tracking_number
                                }
                              </strong>
                            </td>

                            <td>
                              <div>
                                {
                                  shipment.origin ||
                                  "—"
                                }
                              </div>
                              <small>
                                →
                              </small>
                              <div>
                                {
                                  shipment.destination ||
                                  "—"
                                }
                              </div>
                            </td>

                            <td>
                              <StatusBadge
                                status={
                                  shipment.status
                                }
                              />
                            </td>

                            <td>
                              {formatDate(
                                shipment.created_at,
                              )}
                            </td>

                            <td>
                              {formatDate(
                                shipment.updated_at,
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}