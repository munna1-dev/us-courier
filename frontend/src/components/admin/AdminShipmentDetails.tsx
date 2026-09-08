import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type { MouseEvent } from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import LoadingScreen from "../common/LoadingScreen";
import StatusBadge from "../common/StatusBadge";
import ShipmentSummary from "../tracking/ShipmentSummary";
import TrackingTimeline from "../tracking/TrackingTimeline";

import {
  deleteShipment,
  getShipment,
  trackShipment,
} from "../../lib/api";

import type {
  Shipment,
  TrackingEvent,
} from "../../types";

interface AdminShipmentDetailsProps {
  shipmentId: string;
  onBack?: () => void;
  onEdit?: (
    shipment: Shipment,
  ) => void;
  className?: string;
}

interface ShipmentResponse {
  shipment: Shipment | null;
  history: TrackingEvent[];
}

function getErrorMessage(
  error: unknown,
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
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to load shipment information.";
}

function extractResponse(
  response: unknown,
): ShipmentResponse {
  if (
    !response ||
    typeof response !== "object"
  ) {
    return {
      shipment: null,
      history: [],
    };
  }

  const root =
    response as Record<
      string,
      unknown
    >;

  let source:
    | Record<string, unknown>
    | null = root;

  if (
    root.data &&
    typeof root.data === "object" &&
    !Array.isArray(root.data)
  ) {
    source =
      root.data as Record<
        string,
        unknown
      >;
  }

  let shipment: Shipment | null =
    null;

  if (
    source.shipment &&
    typeof source.shipment === "object" &&
    !Array.isArray(source.shipment)
  ) {
    shipment =
      source.shipment as Shipment;
  } else if (
    source.id ||
    source.tracking_number
  ) {
    shipment =
      source as unknown as Shipment;
  }

  let history: TrackingEvent[] =
    [];

  if (Array.isArray(source.history)) {
    history =
      source.history as TrackingEvent[];
  } else if (
    Array.isArray(source.events)
  ) {
    history =
      source.events as TrackingEvent[];
  } else if (
    shipment &&
    Array.isArray(
      (
        shipment as Shipment & {
          history?: TrackingEvent[];
        }
      ).history,
    )
  ) {
    history =
      (
        shipment as Shipment & {
          history?: TrackingEvent[];
        }
      ).history ?? [];
  }

  return {
    shipment,
    history,
  };
}

function formatDate(
  value?: string | null,
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function getIdentifier(
  shipment: Shipment,
): string {
  return (
    shipment.tracking_number ||
    shipment.id ||
    "Shipment"
  );
}

export default function AdminShipmentDetails({
  shipmentId,
  onBack,
  onEdit,
  className = "",
}: AdminShipmentDetailsProps) {
  const [shipment, setShipment] =
    useState<Shipment | null>(null);

  const [history, setHistory] =
    useState<TrackingEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadShipment =
    useCallback(
      async (refresh = false) => {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          let response: unknown;

          try {
            response =
              await getShipment(
                shipmentId,
              );
          } catch {
            response =
              await trackShipment(
                shipmentId,
              );
          }

          const extracted =
            extractResponse(response);

          if (!extracted.shipment) {
            throw new Error(
              "Shipment information is unavailable.",
            );
          }

          setShipment(
            extracted.shipment,
          );

          setHistory(
            extracted.history,
          );
        } catch (err: unknown) {
          setShipment(null);
          setHistory([]);
          setError(
            getErrorMessage(err),
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [shipmentId],
    );

  useEffect(() => {
    void loadShipment();
  }, [loadShipment]);

  useEffect(() => {
    if (shipment) {
      document.title = `${getIdentifier(
        shipment,
      )} — Admin — Dispatch Courier`;
    } else {
      document.title =
        "Shipment Details — Admin — Dispatch Courier";
    }
  }, [shipment]);

  const handleRefresh =
    useCallback(() => {
      void loadShipment(true);
    }, [loadShipment]);

  const handleDelete =
    useCallback(async () => {
      if (!shipment?.id) {
        setError(
          "This shipment cannot be deleted because its ID is unavailable.",
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Delete shipment ${getIdentifier(
            shipment,
          )}? This action cannot be undone.`,
        );

      if (!confirmed) {
        return;
      }

      setDeleting(true);
      setError("");

      try {
        await deleteShipment(
          shipment.id,
        );

        if (onBack) {
          onBack();
          return;
        }

        window.history.replaceState(
          {},
          "",
          "/admin/shipments",
        );

        window.dispatchEvent(
          new PopStateEvent(
            "popstate",
          ),
        );
      } catch (err: unknown) {
        setError(
          getErrorMessage(
            err,
          ),
        );
      } finally {
        setDeleting(false);
      }
    }, [onBack, shipment]);

  const handleEdit =
    useCallback(() => {
      if (!shipment) return;

      if (onEdit) {
        onEdit(shipment);
        return;
      }

      const identifier =
        shipment.id ||
        shipment.tracking_number;

      if (!identifier) {
        return;
      }

      const nextPath = `/admin/shipments/${encodeURIComponent(
        identifier,
      )}/edit`;

      const currentPath =
        window.location.pathname;

      if (currentPath === nextPath) {
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
    }, [onEdit, shipment]);

  const handleTrackPublic =
    useCallback(
      (
        event: MouseEvent<HTMLAnchorElement>,
      ) => {
        event.preventDefault();

        if (
          !shipment?.tracking_number
        ) {
          return;
        }

        const path = `/track/${encodeURIComponent(
          shipment.tracking_number,
        )}`;

        if (
          window.location.pathname ===
          path
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
      [shipment],
    );

  if (loading) {
    return (
      <LoadingScreen
        message="Loading shipment details..."
        fullScreen={false}
      />
    );
  }

  if (!shipment) {
    return (
      <section
        className={`admin-shipment-details ${
          className
            ? `admin-shipment-details--${className}`
            : ""
        }`.trim()}
      >
        <div className="dashboard-section__header">
          <div>
            <h1>
              Shipment Details
            </h1>

            <p>
              Review shipment and tracking
              information.
            </p>
          </div>

          {onBack && (
            <Button
              type="button"
              variant="secondary"
              onClick={onBack}
            >
              Back to shipments
            </Button>
          )}
        </div>

        <Alert
          variant="error"
          title="Shipment unavailable"
        >
          {error ||
            "The requested shipment could not be found."}
        </Alert>

        <Button
          type="button"
          variant="secondary"
          onClick={handleRefresh}
          loading={refreshing}
        >
          Try again
        </Button>
      </section>
    );
  }

  return (
    <section
      className={`admin-shipment-details ${
        className
          ? `admin-shipment-details--${className}`
          : ""
      }`.trim()}
    >
      <div className="dashboard-section__header">
        <div>
          <div className="admin-shipment-details__breadcrumb">
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={onBack}
              disabled={!onBack}
            >
              ← Back
            </button>
          </div>

          <span className="page-heading__eyebrow">
            Shipment
          </span>

          <h1>
            {getIdentifier(
              shipment,
            )}
          </h1>

          <div className="admin-shipment-details__status">
            <StatusBadge
              status={shipment.status}
            />
          </div>
        </div>

        <div className="admin-shipment-details__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleRefresh}
            loading={refreshing}
            disabled={refreshing}
          >
            Refresh
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleEdit}
          >
            Edit
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={() =>
              void handleDelete()
            }
            loading={deleting}
            disabled={deleting}
          >
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          variant="warning"
          title="Shipment update"
          dismissible
          onDismiss={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      <div className="admin-shipment-details__grid">
        <div className="admin-shipment-details__main">
          <ShipmentSummary
            shipment={shipment}
          />

          <TrackingTimeline
            events={history}
          />
        </div>

        <aside className="admin-shipment-details__aside">
          <section className="card">
            <div className="card__header">
              <h2>
                Shipment metadata
              </h2>
            </div>

            <dl className="details-list">
              <div>
                <dt>Shipment ID</dt>
                <dd>
                  {shipment.id ||
                    "—"}
                </dd>
              </div>

              <div>
                <dt>Service type</dt>
                <dd>
                  {shipment.service_type ||
                    "Standard"}
                </dd>
              </div>

              <div>
                <dt>Package</dt>
                <dd>
                  {shipment.package_description ||
                    "—"}
                </dd>
              </div>

              <div>
                <dt>Weight</dt>
                <dd>
                  {shipment.weight !==
                    undefined &&
                  shipment.weight !==
                    null
                    ? String(
                        shipment.weight,
                      )
                    : "—"}
                </dd>
              </div>

              <div>
                <dt>Created</dt>
                <dd>
                  {formatDate(
                    shipment.created_at,
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

          {shipment.tracking_number && (
            <section className="card">
              <div className="card__header">
                <h2>
                  Public tracking
                </h2>
              </div>

              <p>
                Open the customer-facing
                tracking page for this
                shipment.
              </p>

              <a
                href={`/track/${encodeURIComponent(
                  shipment.tracking_number,
                )}`}
                className="button button--primary"
                onClick={
                  handleTrackPublic
                }
              >
                View public tracking
              </a>
            </section>
          )}
        </aside>
      </div>
    </section>
  );
}