import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Alert from "../common/Alert";
import LoadingScreen from "../common/LoadingScreen";
import EmptyState from "../common/EmptyState";
import StatCard from "./StatCard";
import QuickActions from "./QuickActions";
import ShipmentTable from "./ShipmentTable";
import RecentActivity from "./RecentActivity";

import {
  getDashboardSummary,
  getShipments,
} from "../../lib/api";

import type {
  DashboardSummary,
  Shipment,
  TrackingEvent,
} from "../../types";

interface DashboardOverviewProps {
  onViewShipments?: () => void;
  onSelectShipment?: (
    shipmentId: string,
  ) => void;
}

interface SummaryShape extends DashboardSummary {
  total_shipments?: number;
  totalShipments?: number;
  total?: number;
  in_transit?: number;
  inTransit?: number;
  in_transit_shipments?: number;
  delivered?: number;
  delivered_shipments?: number;
  pending?: number;
  pending_shipments?: number;
  recent_activity?: TrackingEvent[];
  recentActivity?: TrackingEvent[];
}

interface DashboardRequestState {
  summary:
    | "loading"
    | "success"
    | "error";
  shipments:
    | "loading"
    | "success"
    | "error";
}

const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY = 500;

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

function sleep(
  milliseconds: number,
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(
      resolve,
      milliseconds,
    );
  });
}

async function withRetry<T>(
  request: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;

  for (
    let attempt = 0;
    attempt <= retries;
    attempt += 1
  ) {
    try {
      return await request();
    } catch (error) {
      lastError = error;

      if (attempt >= retries) {
        break;
      }

      const delay =
        INITIAL_RETRY_DELAY *
        2 ** attempt;

      await sleep(delay);
    }
  }

  throw lastError;
}

function readNumber(
  source: SummaryShape | null,
  ...keys: string[]
): number {
  if (!source) {
    return 0;
  }

  for (const key of keys) {
    const value =
      source[
        key as keyof SummaryShape
      ];

    if (
      typeof value === "number"
    ) {
      return value;
    }

    if (
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      const parsed = Number(value);

      if (
        Number.isFinite(parsed)
      ) {
        return parsed;
      }
    }
  }

  return 0;
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

  if (
    Array.isArray(value.data)
  ) {
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
    Array.isArray(
      (
        value.data as Record<
          string,
          unknown
        >
      ).shipments,
    )
  ) {
    return (
      (
        value.data as Record<
          string,
          unknown
        >
      ).shipments as Shipment[]
    );
  }

  return [];
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
    return value.data as SummaryShape;
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

function extractActivity(
  summary: SummaryShape | null,
): TrackingEvent[] {
  if (!summary) {
    return [];
  }

  if (
    Array.isArray(
      summary.recent_activity,
    )
  ) {
    return summary.recent_activity;
  }

  if (
    Array.isArray(
      summary.recentActivity,
    )
  ) {
    return summary.recentActivity;
  }

  return [];
}

export default function DashboardOverview({
  onViewShipments,
  onSelectShipment,
}: DashboardOverviewProps) {
  const [summary, setSummary] =
    useState<SummaryShape | null>(
      null,
    );

  const [shipments, setShipments] =
    useState<Shipment[]>([]);

  const [requestState, setRequestState] =
    useState<DashboardRequestState>({
      summary: "loading",
      shipments: "loading",
    });

  const [error, setError] =
    useState("");

  const loadSummary =
    useCallback(async () => {
      setRequestState(
        (current) => ({
          ...current,
          summary: "loading",
        }),
      );

      try {
        const response =
          await withRetry(() =>
            getDashboardSummary(),
          );

        setSummary(
          extractSummary(
            response,
          ),
        );

        setRequestState(
          (current) => ({
            ...current,
            summary: "success",
          }),
        );

        return true;
      } catch (err: unknown) {
        setRequestState(
          (current) => ({
            ...current,
            summary: "error",
          }),
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load your shipment summary.",
          ),
        );

        return false;
      }
    }, []);

  const loadShipments =
    useCallback(async () => {
      setRequestState(
        (current) => ({
          ...current,
          shipments: "loading",
        }),
      );

      try {
        const response =
          await withRetry(() =>
            getShipments({
              page: 1,
              limit: 10,
            }),
          );

        setShipments(
          extractShipments(
            response,
          ),
        );

        setRequestState(
          (current) => ({
            ...current,
            shipments: "success",
          }),
        );

        return true;
      } catch (err: unknown) {
        setRequestState(
          (current) => ({
            ...current,
            shipments: "error",
          }),
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load your recent shipments.",
          ),
        );

        return false;
      }
    }, []);

  const loadOverview =
    useCallback(async () => {
      setError("");

      const results =
        await Promise.allSettled([
          loadSummary(),
          loadShipments(),
        ]);

      const failedRequests =
        results.filter(
          (result) =>
            result.status ===
              "rejected" ||
            (result.status ===
              "fulfilled" &&
              result.value ===
                false),
        );

      if (
        failedRequests.length === 0
      ) {
        setError("");
      }
    }, [
      loadShipments,
      loadSummary,
    ]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const handleRetrySummary =
    useCallback(() => {
      void loadSummary();
    }, [loadSummary]);

  const handleRetryShipments =
    useCallback(() => {
      void loadShipments();
    }, [loadShipments]);

  const handleRefresh =
    useCallback(() => {
      void loadOverview();
    }, [loadOverview]);

  /*
   * Open a shipment from the dashboard.
   *
   * Prefer the parent callback when supplied so the
   * dashboard can integrate with the application's
   * existing router. Otherwise navigate directly to
   * the shipment details page.
   */
  const handleShipmentSelect =
    useCallback(
      (shipment: Shipment) => {
        const shipmentId =
          String(
            shipment.id ?? "",
          ).trim();

        if (!shipmentId) {
          return;
        }

        if (onSelectShipment) {
          onSelectShipment(
            shipmentId,
          );

          return;
        }

        const nextPath =
          `/dashboard/shipments/${encodeURIComponent(
            shipmentId,
          )}`;

        const currentPath =
          window.location.pathname;

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
      [onSelectShipment],
    );

  const isSummaryLoading =
    requestState.summary ===
    "loading";

  const isShipmentsLoading =
    requestState.shipments ===
    "loading";

  const isInitialLoading =
    isSummaryLoading &&
    isShipmentsLoading &&
    !summary &&
    shipments.length === 0;

  if (isInitialLoading) {
    return (
      <LoadingScreen
        message="Loading your dashboard..."
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
    );

  const pending =
    readNumber(
      summary,
      "pending",
      "pending_shipments",
    );

  const activity =
    extractActivity(summary);

  const summaryFailed =
    requestState.summary ===
    "error";

  const shipmentsFailed =
    requestState.shipments ===
    "error";

  return (
    <div className="dashboard-overview">
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>

          <p>
            Monitor your shipments and
            keep track of your
            deliveries.
          </p>
        </div>

        <button
          type="button"
          className="button button--secondary"
          onClick={handleRefresh}
          disabled={
            isSummaryLoading ||
            isShipmentsLoading
          }
        >
          {isSummaryLoading ||
          isShipmentsLoading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {error && (
        <Alert
          variant="warning"
          title="Some dashboard information is unavailable"
        >
          {error}
        </Alert>
      )}

      <section
        className="dashboard-stats"
        aria-label="Shipment summary"
      >
        {summaryFailed ? (
          <div className="dashboard-section__error">
            <Alert
              variant="error"
              title="Shipment summary unavailable"
            >
              We couldn't load your
              shipment statistics
              after several attempts.

              <button
                type="button"
                className="button button--ghost"
                onClick={
                  handleRetrySummary
                }
              >
                Try again
              </button>
            </Alert>
          </div>
        ) : (
          <>
            <StatCard
              label="Total shipments"
              value={
                totalShipments
              }
              description="All shipments associated with your account"
              loading={
                isSummaryLoading
              }
            />

            <StatCard
              label="In transit"
              value={inTransit}
              description="Shipments currently moving through the network"
              loading={
                isSummaryLoading
              }
            />

            <StatCard
              label="Delivered"
              value={delivered}
              description="Shipments successfully delivered"
              loading={
                isSummaryLoading
              }
            />

            <StatCard
              label="Pending"
              value={pending}
              description="Shipments awaiting dispatch or processing"
              loading={
                isSummaryLoading
              }
            />
          </>
        )}
      </section>

      <QuickActions
        onTrackShipment={
          onViewShipments
        }
        onViewShipments={
          onViewShipments
        }
      />

      <section className="dashboard-section">
        <div className="dashboard-section__header">
          <div>
            <h2>
              Recent shipments
            </h2>

            <p>
              Your latest shipment
              activity.
            </p>
          </div>

          <button
            type="button"
            className="button button--ghost"
            onClick={
              onViewShipments
            }
          >
            View all
          </button>
        </div>

        {shipmentsFailed ? (
          <Alert
            variant="error"
            title="Recent shipments unavailable"
          >
            We couldn't load your
            recent shipments after
            several attempts.

            <button
              type="button"
              className="button button--ghost"
              onClick={
                handleRetryShipments
              }
            >
              Try again
            </button>
          </Alert>
        ) : isShipmentsLoading ? (
          <LoadingScreen
            message="Loading recent shipments..."
          />
        ) : shipments.length > 0 ? (
          <ShipmentTable
            shipments={shipments}
            onSelect={
              handleShipmentSelect
            }
          />
        ) : (
          <EmptyState
            title="No shipments yet"
            description="Your shipment activity will appear here once you have a shipment."
          />
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__header">
          <div>
            <h2>
              Recent activity
            </h2>

            <p>
              The latest updates from
              your shipments.
            </p>
          </div>
        </div>

        {summaryFailed ? (
          <Alert
            variant="warning"
            title="Recent activity unavailable"
          >
            Recent activity is
            temporarily unavailable.
            You can retry the shipment
            summary above.
          </Alert>
        ) : (
          <RecentActivity
            events={activity}
          />
        )}
      </section>
    </div>
  );
}