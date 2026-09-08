import type {
  TrackingEvent,
} from "../../types";

interface TrackingTimelineProps {
  events: TrackingEvent[];
}

function labelStatus(
  value: string
) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function TrackingTimeline({
  events,
}: TrackingTimelineProps) {
  if (!events.length) {
    return (
      <section className="tracking-card">
        <h2>
          Tracking history
        </h2>

        <p className="muted">
          No tracking events have
          been recorded yet.
        </p>
      </section>
    );
  }

  const sorted = [
    ...events,
  ].sort(
    (a, b) =>
      new Date(
        b.event_time ??
          b.eventTime ??
          b.created_at ??
          b.createdAt ??
          0
      ).getTime() -
      new Date(
        a.event_time ??
          a.eventTime ??
          a.created_at ??
          a.createdAt ??
          0
      ).getTime()
  );

  return (
    <section className="tracking-card">
      <h2>
        Tracking history
      </h2>

      <div className="timeline">
        {sorted.map(
          (event, index) => {
            const time =
              event.event_time ??
              event.eventTime ??
              event.created_at ??
              event.createdAt;

            return (
              <div
                className="timeline__item"
                key={
                  event.id ||
                  `${event.status}-${index}`
                }
              >
                <div className="timeline__dot" />

                <div className="timeline__content">
                  <div className="timeline__header">
                    <strong>
                      {event.title ??
                        labelStatus(
                          event.status
                        )}
                    </strong>

                    {time && (
                      <time>
                        {new Date(
                          time
                        ).toLocaleString()}
                      </time>
                    )}
                  </div>

                  {event.description && (
                    <p>
                      {
                        event.description
                      }
                    </p>
                  )}

                  {event.location && (
                    <span>
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </section>
  );
}