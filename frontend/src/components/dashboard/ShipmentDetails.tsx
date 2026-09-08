import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import LoadingScreen from "../common/LoadingScreen";
import StatusBadge from "../common/StatusBadge";
import ShipmentSummary from "../tracking/ShipmentSummary";
import TrackingTimeline from "../tracking/TrackingTimeline";

import {
  getShipment,
  trackShipment,
} from "../../lib/api";

import type {
  Shipment,
  TrackingEvent,
} from "../../types";

interface ShipmentDetailsProps {
  shipmentId: string;
  onBack?: () => void;
  className?: string;
}

interface ShipmentResult {
  shipment: Shipment | null;
  history: TrackingEvent[];
}

function extractShipment(
  response: unknown,
): Shipment | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const value =
    response as Record<string, unknown>;

  if (
    value.shipment &&
    typeof value.shipment === "object"
  ) {
    return value.shipment as unknown as Shipment;
  }

  if (
    value.data &&
    typeof value.data === "object" &&
    !Array.isArray(value.data)
  ) {
    const data =
      value.data as Record<string, unknown>;

    if (
      data.shipment &&
      typeof data.shipment === "object"
    ) {
      return data.shipment as unknown as Shipment;
    }

    if (
      "tracking_number" in data ||
      "id" in data
    ) {
      return data as unknown as Shipment;
    }
  }

  if (
    "tracking_number" in value ||
    "id" in value
  ) {
    return value as unknown as Shipment;
  }

  return null;
}

function extractHistory(
  response: unknown,
): TrackingEvent[] {
  if (!response || typeof response !== "object") {
    return [];
  }

  const value =
    response as Record<string, unknown>;

  if (Array.isArray(value.history)) {
    return value.history as TrackingEvent[];
  }

  if (Array.isArray(value.events)) {
    return value.events as TrackingEvent[];
  }

  if (
    value.data &&
    typeof value.data === "object" &&
    !Array.isArray(value.data)
  ) {
    const data =
      value.data as Record<string, unknown>;

    if (Array.isArray(data.history)) {
      return data.history as TrackingEvent[];
    }

    if (Array.isArray(data.events)) {
      return data.events as TrackingEvent[];
    }
  }

  return [];
}

function extractTrackingResult(
  response: unknown,
): ShipmentResult {
  return {
    shipment: extractShipment(response),
    history: extractHistory(response),
  };
}

function getIdentifier(
  shipment: Shipment,
): string {
  return (
    shipment.tracking_number ||
    shipment.id ||
    ""
  );
}

function getShipmentPath(
  shipment: Shipment,
): string {
  const identifier =
    getIdentifier(shipment);

  if (!identifier) {
    return "/dashboard/shipments";
  }

  return `/dashboard/shipments/${encodeURIComponent(
    identifier,
  )}`;
}

function formatDate(
  value?: string | null,
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function ShipmentDetails({
  shipmentId,
  onBack,
  className = "",
}: ShipmentDetailsProps) {
  const [shipment, setShipment] =
    useState<Shipment | null>(null);

  const [history, setHistory] =
    useState<TrackingEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [retryKey, setRetryKey] =
    useState(0);

  const loadShipment =
    useCallback(
      async (isRefresh = false) => {
        if (!shipmentId.trim()) {
          setError(
            "A shipment identifier is required.",
          );
          setShipment(null);
          setHistory([]);
          setLoading(false);
          return;
        }

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          let response: unknown;

          try {
            response = await getShipment(
              shipmentId,
            );
          } catch (primaryError) {
            response =
              await trackShipment(
                shipmentId,
              );

            if (!response) {
              throw primaryError;
            }
          }

          const result =
            extractTrackingResult(
              response,
            );

          if (!result.shipment) {
            throw new Error(
              "Shipment information is unavailable.",
            );
          }

          setShipment(
            result.shipment,
          );

          setHistory(
            result.history,
          );
        } catch (err: unknown) {
          const message =
            err instanceof Error &&
            err.message.trim()
              ? err.message
              : "Unable to load shipment details.";

          setError(message);

          if (!isRefresh) {
            setShipment(null);
            setHistory([]);
          }
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [shipmentId],
    );

  useEffect(() => {
    void loadShipment();
  }, [loadShipment, retryKey]);

  const handleRetry =
    useCallback(() => {
      setRetryKey(
        (current) => current + 1,
      );
    }, []);

  const handleRefresh =
    useCallback(() => {
      void loadShipment(true);
    }, [loadShipment]);

  const handlePublicTracking =
    useCallback(() => {
      if (!shipment) return;

      const identifier =
        getIdentifier(shipment);

      if (!identifier) return;

      const nextPath =
        `/track/${encodeURIComponent(
          identifier,
        )}`;

      const currentPath =
        window.location.pathname.replace(
          /\/+$/,
          "",
        ) || "/";

      if (currentPath === nextPath) {
        return;
      }

      window.history.pushState(
        {},
        "",
        nextPath,
      );

      window.dispatchEvent(
        new PopStateEvent("popstate"),
      );
    }, [shipment]);

  if (loading) {
    return (
      <div
        className={`shipment-details ${
          className
            ? `shipment-details--${className}`
            : ""
        }`.trim()}
      >
        <LoadingScreen
          message="Loading shipment details..."
        />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div
        className={`shipment-details ${
          className
            ? `shipment-details--${className}`
            : ""
        }`.trim()}
      >
        {error && (
          <Alert
            variant="error"
            title="Shipment unavailable"
          >
            <p>{error}</p>

            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={handleRetry}
            >
              Try again
            </Button>
          </Alert>
        )}

        {!error && (
          <EmptyState
            title="Shipment not found"
            description="We couldn't find the requested shipment."
          />
        )}

        <div className="shipment-details__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
          >
            Back to shipments
          </Button>
        </div>
      </div>
    );
  }

  const identifier =
    getIdentifier(shipment);

  return (
    <div
      className={`shipment-details ${
        className
          ? `shipment-details--${className}`
          : ""
      }`.trim()}
    >
      <div className="shipment-details__header">
        <div>
          <button
            type="button"
            className="button button--ghost"
            onClick={onBack}
          >
            ← Back to shipments
          </button>

          <div className="page-heading">
            <div>
              <span className="shipment-details__eyebrow">
                Shipment
              </span>

              <h1>
                {identifier ||
                  "Shipment details"}
              </h1>

              <p>
                Review the current status,
                route, and tracking history.
              </p>
            </div>

            <StatusBadge
              status={shipment.status}
              size="large"
            />
          </div>
        </div>

        <div className="shipment-details__actions">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={handleRefresh}
            loading={refreshing}
          >
            Refresh
          </Button>

          <Button
            type="button"
            variant="primary"
            size="small"
            onClick={
              handlePublicTracking
            }
          >
            Public tracking
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          variant="warning"
          title="Latest information unavailable"
        >
          <p>{error}</p>

          <Button
            type="button"
            variant="ghost"
            size="small"
            onClick={handleRetry}
          >
            Try again
          </Button>
        </Alert>
      )}

      <div className="shipment-details__grid">
        <main className="shipment-details__main">
          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <div>
                <h2>
                  Shipment information
                </h2>

                <p>
                  Current shipment
                  details.
                </p>
              </div>
            </div>

            <ShipmentSummary
              shipment={shipment}
            />
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <div>
                <h2>
                  Tracking history
                </h2>

                <p>
                  Updates recorded for
                  this shipment.
                </p>
              </div>
            </div>

            <TrackingTimeline
              events={history}
            />
          </section>
        </main>

        <aside className="shipment-details__sidebar">
          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <div>
                <h2>Delivery</h2>

                <p>
                  Current delivery
                  information.
                </p>
              </div>
            </div>

            <dl className="shipment-details__metadata">
              <div>
                <dt>Status</dt>

                <dd>
                  <StatusBadge
                    status={
                      shipment.status
                    }
                  />
                </dd>
              </div>

              <div>
                <dt>Current location</dt>

                <dd>
                  {shipment.current_location ||
                    "—"}
                </dd>
              </div>

              <div>
                <dt>Origin</dt>

                <dd>
                  {shipment.origin ||
                    "—"}
                </dd>
              </div>

              <div>
                <dt>Destination</dt>

                <dd>
                  {shipment.destination ||
                    "—"}
                </dd>
              </div>

              <div>
                <dt>Estimated delivery</dt>

                <dd>
                  {formatDate(
                    shipment.estimated_delivery,
                  )}
                </dd>
              </div>

              <div>
                <dt>Last updated</dt>

                <dd>
                  {formatDate(
                    shipment.updated_at,
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}