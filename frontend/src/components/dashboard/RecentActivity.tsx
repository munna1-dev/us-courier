import { useMemo } from "react";

import EmptyState from "../common/EmptyState";
import StatusBadge from "../common/StatusBadge";

import type { TrackingEvent } from "../../types";

interface RecentActivityProps {
  events?: TrackingEvent[];
  loading?: boolean;
  className?: string;
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

function getEventTitle(
  event: TrackingEvent,
): string {
  return (
    event.description ||
    event.status ||
    "Shipment update"
  );
}

function getEventStatus(
  event: TrackingEvent,
): string {
  return event.status || "update";
}

function getEventLocation(
  event: TrackingEvent,
): string {
  return event.location || "Location unavailable";
}

function getEventTime(
  event: TrackingEvent,
): string | null {
  return (
    event.event_time ||
    event.eventTime ||
    event.created_at ||
    event.createdAt ||
    null
  );
}

function getEventKey(
  event: TrackingEvent,
  index: number,
): string {
  return (
    event.id ||
    `${event.shipment_id || "shipment"}-${
      getEventTime(event) ||
      index
    }`
  );
}

export default function RecentActivity({
  events = [],
  loading = false,
  className = "",
}: RecentActivityProps) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aTime = getEventTime(a);
      const bTime = getEventTime(b);

      if (!aTime && !bTime) return 0;
      if (!aTime) return 1;
      if (!bTime) return -1;

      const aDate = new Date(aTime).getTime();
      const bDate = new Date(bTime).getTime();

      if (
        Number.isNaN(aDate) ||
        Number.isNaN(bDate)
      ) {
        return 0;
      }

      return bDate - aDate;
    });
  }, [events]);

  if (loading) {
    return (
      <section
        className={`recent-activity ${
          className
            ? `recent-activity--${className}`
            : ""
        }`.trim()}
        aria-busy="true"
        aria-labelledby="recent-activity-title"
      >
        <div className="dashboard-section__header">
          <div>
            <h2 id="recent-activity-title">
              Recent activity
            </h2>
            <p>
              Loading the latest shipment
              updates...
            </p>
          </div>
        </div>

        <div
          className="recent-activity__loading"
          role="status"
        >
          <span
            className="loading-spinner"
            aria-hidden="true"
          />
          <span>
            Loading recent activity...
          </span>
        </div>
      </section>
    );
  }

  if (!sortedEvents.length) {
    return (
      <EmptyState
        title="No recent activity"
        description="Shipment updates will appear here as your deliveries progress."
        className={className}
      />
    );
  }

  return (
    <section
      className={`recent-activity ${
        className
          ? `recent-activity--${className}`
          : ""
      }`.trim()}
      aria-labelledby="recent-activity-title"
    >
      <div className="dashboard-section__header">
        <div>
          <h2 id="recent-activity-title">
            Recent activity
          </h2>

          <p>
            The latest updates from your
            shipments.
          </p>
        </div>
      </div>

      <div
        className="recent-activity__list"
        role="list"
      >
        {sortedEvents.map(
          (event, index) => {
            const eventTime =
              getEventTime(event);

            return (
              <article
                key={getEventKey(
                  event,
                  index,
                )}
                className="recent-activity__item"
                role="listitem"
              >
                <div
                  className="recent-activity__marker"
                  aria-hidden="true"
                >
                  <span />
                </div>

                <div className="recent-activity__content">
                  <div className="recent-activity__top">
                    <h3>
                      {getEventTitle(
                        event,
                      )}
                    </h3>

                    <StatusBadge
                      status={getEventStatus(
                        event,
                      )}
                      size="small"
                    />
                  </div>

                  <div className="recent-activity__metadata">
                    <span>
                      {getEventLocation(
                        event,
                      )}
                    </span>

                    {eventTime && (
                      <time
                        dateTime={
                          eventTime
                        }
                      >
                        {formatDate(
                          eventTime,
                        )}
                      </time>
                    )}
                  </div>

                  {event.shipment_id && (
                    <span className="recent-activity__shipment">
                      Shipment:{" "}
                      {event.shipment_id}
                    </span>
                  )}
                </div>
              </article>
            );
          },
        )}
      </div>
    </section>
  );
}