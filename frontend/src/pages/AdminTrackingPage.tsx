import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Input from "../components/common/Input";
import LoadingScreen from "../components/common/LoadingScreen";
import StatusBadge from "../components/common/StatusBadge";
import { trackShipment } from "../lib/api";
import type {
  Shipment,
  TrackingEvent,
} from "../types";

interface AdminTrackingPageProps {
  className?: string;
}

interface TrackingResult {
  shipment: Shipment;
  history: TrackingEvent[];
}

function normalizeTrackingNumber(
  value: string,
): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function extractTrackingResult(
  response: unknown,
): TrackingResult | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const root =
    response as Record<string, unknown>;

  const data =
    root.data &&
    typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const shipment =
    data.shipment &&
    typeof data.shipment === "object"
      ? (data.shipment as Shipment)
      : null;

  if (!shipment) {
    return null;
  }

  const historyValue =
    data.history;

  const history =
    Array.isArray(historyValue)
      ? (historyValue as TrackingEvent[])
      : [];

  return {
    shipment,
    history,
  };
}

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function AdminTrackingPage({
  className = "",
}: AdminTrackingPageProps) {
  const [trackingNumber, setTrackingNumber] =
    useState("");

  const [result, setResult] =
    useState<TrackingResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searched, setSearched] =
    useState(false);

  useEffect(() => {
    document.title =
      "Tracking Lookup — Dispatch Courier";
  }, []);

  const searchTracking =
    useCallback(
      async (value?: string) => {
        const normalized =
          normalizeTrackingNumber(
            value ?? trackingNumber,
          );

        if (!normalized) {
          setError(
            "Enter a tracking number.",
          );
          setResult(null);
          setSearched(false);
          return;
        }

        setTrackingNumber(
          normalized,
        );
        setLoading(true);
        setError("");
        setResult(null);
        setSearched(true);

        try {
          const response =
            await trackShipment(
              normalized,
            );

          const parsed =
            extractTrackingResult(
              response,
            );

          if (!parsed) {
            throw new Error(
              "No shipment was found for this tracking number.",
            );
          }

          setResult(parsed);
        } catch (requestError) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to retrieve tracking information.",
          );
        } finally {
          setLoading(false);
        }
      },
      [trackingNumber],
    );

  const handleSubmit =
    useCallback(
      (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void searchTracking();
      },
      [searchTracking],
    );

  const handleRefresh =
    useCallback(() => {
      if (!trackingNumber) {
        return;
      }

      void searchTracking(
        trackingNumber,
      );
    }, [
      searchTracking,
      trackingNumber,
    ]);

  const handleClear =
    useCallback(() => {
      setTrackingNumber("");
      setResult(null);
      setError("");
      setSearched(false);
    }, []);

  return (
    <section
      className={`admin-tracking-page ${className}`.trim()}
    >
      <div className="page-heading">
        <div>
          <h1>Tracking Lookup</h1>
          <p>
            Search any shipment and review its
            current status and tracking history.
          </p>
        </div>
      </div>

      <div className="card">
        <form
          className="tracking-search-form"
          onSubmit={handleSubmit}
        >
          <Input
            label="Tracking number"
            value={trackingNumber}
            placeholder="Enter tracking number"
            autoComplete="off"
            required
            disabled={loading}
            onChange={(event) =>
              setTrackingNumber(
                event.target.value.toUpperCase(),
              )
            }
          />

          <div className="tracking-search-form__actions">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Search shipment
            </Button>

            {searched && (
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={handleClear}
              >
                Clear
              </Button>
            )}
          </div>
        </form>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Tracking lookup failed"
          dismissible
          onDismiss={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      {loading && (
        <LoadingScreen
          message="Loading shipment tracking..."
        />
      )}

      {!loading &&
        !result &&
        !error &&
        !searched && (
          <EmptyState
            title="Search for a shipment"
            description="Enter a tracking number above to view shipment details and tracking history."
          />
        )}

      {!loading &&
        searched &&
        !result &&
        !error && (
          <EmptyState
            title="Shipment not found"
            description="No shipment matched the tracking number you entered."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={handleClear}
              >
                New search
              </Button>
            }
          />
        )}

      {!loading && result && (
        <div className="admin-tracking-result">
          <div className="admin-tracking-result__header">
            <div>
              <span className="eyebrow">
                Shipment
              </span>

              <h2>
                {result.shipment.tracking_number}
              </h2>

              <p>
                {result.shipment.package_description ||
                  "Shipment"}
              </p>
            </div>

            <div className="admin-tracking-result__actions">
              <StatusBadge
                status={
                  result.shipment.status
                }
              />

              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <span className="detail-card__label">
                Sender
              </span>

              <strong>
                {result.shipment.sender_name ||
                  "—"}
              </strong>
            </div>

            <div className="detail-card">
              <span className="detail-card__label">
                Recipient
              </span>

              <strong>
                {result.shipment.receiver_name ||
                  "—"}
              </strong>
            </div>

            <div className="detail-card">
              <span className="detail-card__label">
                Origin
              </span>

              <strong>
                {result.shipment.origin ||
                  "—"}
              </strong>
            </div>

            <div className="detail-card">
              <span className="detail-card__label">
                Destination
              </span>

              <strong>
                {result.shipment.destination ||
                  "—"}
              </strong>
            </div>

            <div className="detail-card">
              <span className="detail-card__label">
                Current location
              </span>

              <strong>
                {result.shipment.current_location ||
                  "—"}
              </strong>
            </div>

            <div className="detail-card">
              <span className="detail-card__label">
                Service
              </span>

              <strong>
                {result.shipment.service_type ||
                  "—"}
              </strong>
            </div>

            <div className="detail-card">
              <span className="detail-card__label">
                Weight
              </span>

              <strong>
                {result.shipment.weight != null
                  ? `${result.shipment.weight}`
                  : "—"}
              </strong>
            </div>

            <div className="detail-card">
              <span className="detail-card__label">
                Estimated delivery
              </span>

              <strong>
                {formatDate(
                  result.shipment
                    .estimated_delivery,
                )}
              </strong>
            </div>
          </div>

          <section className="tracking-history">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  Shipment history
                </span>

                <h2>
                  Tracking events
                </h2>
              </div>

              <span className="muted-text">
                {result.history.length}{" "}
                {result.history.length === 1
                  ? "event"
                  : "events"}
              </span>
            </div>

            {result.history.length === 0 ? (
              <EmptyState
                title="No tracking events"
                description="This shipment does not have any tracking history recorded yet."
              />
            ) : (
              <ol className="tracking-history__list">
                {result.history.map(
                  (event, index) => (
                    <li
                      key={
                        event.id ||
                        `${event.event_time}-${index}`
                      }
                      className="tracking-history__item"
                    >
                      <div className="tracking-history__marker">
                        <span />
                      </div>

                      <div className="tracking-history__content">
                        <div className="tracking-history__top">
                          <StatusBadge
                            status={
                              event.status
                            }
                            size="small"
                          />

                          <time>
                            {formatDate(
                              event.event_time,
                            )}
                          </time>
                        </div>

                        <h3>
                          {event.description ||
                            event.status ||
                            "Shipment update"}
                        </h3>

                        <p>
                          {event.location ||
                            "Location unavailable"}
                        </p>
                      </div>
                    </li>
                  ),
                )}
              </ol>
            )}
          </section>
        </div>
      )}
    </section>
  );
}