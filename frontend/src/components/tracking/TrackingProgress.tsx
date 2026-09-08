import type { Shipment, TrackingEvent } from "../../types";

interface TrackingProgressProps {
  shipment: Shipment;
  events: TrackingEvent[];
}

const STAGES = [
  {
    key: "pending",
    label: "Created",
  },
  {
    key: "picked_up",
    label: "Picked Up",
  },
  {
    key: "in_transit",
    label: "In Transit",
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
  },
  {
    key: "delivered",
    label: "Delivered",
  },
] as const;

function normalizeStatus(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getStageIndex(status?: string | null): number {
  const normalized = normalizeStatus(status);

  if (
    normalized === 'created' ||
    normalized === 'shipment_created' ||
    normalized === 'pending'
  ) {
    return 0;
  }

  if (
    normalized === 'picked_up' ||
    normalized === 'pickedup' ||
    normalized === 'pickup'
  ) {
    return 1;
  }

  if (
    normalized === 'in_transit' ||
    normalized === 'transit' ||
    normalized === 'intransit'
  ) {
    return 2;
  }

  if (
    normalized === 'out_for_delivery' ||
    normalized === 'outfordelivery'
  ) {
    return 3;
  }

  if (normalized === 'delivered') {
    return 4;
  }

  return 0;
}
function getLatestStage(
  shipment: Shipment,
  events: TrackingEvent[]
): number {
  const shipmentStage = getStageIndex(
    shipment.status
  );

  const eventStages = events.map((event) =>
    getStageIndex(event.status)
  );

  return Math.max(
    shipmentStage,
    ...eventStages,
    0
  );
}

function labelStatus(value?: string | null): string {
  if (!value) {
    return "Shipment Created";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function TrackingProgress({
  shipment,
  events,
}: TrackingProgressProps) {
  const currentStage = getLatestStage(
    shipment,
    events
  );

  const currentLabel =
    STAGES[currentStage]?.label ??
    labelStatus(shipment.status);

  const progress =
    STAGES.length <= 1
      ? 0
      : (currentStage /
          (STAGES.length - 1)) *
        100;

  const latestEvent = [...events]
    .sort(
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
    )[0];

  const latestLocation =
    latestEvent?.location ??
    shipment.current_location ??
    shipment.currentLocation ??
    "In transit";

  return (
    <section className="tracking-card tracking-progress">
      <div className="tracking-progress__header">
        <div>
          <p className="page-eyebrow">
            Shipment progress
          </p>

          <h2>
            {currentLabel}
          </h2>
        </div>

        <span className="tracking-progress__location">
          {latestLocation}
        </span>
      </div>

      <div
        className="tracking-progress__track"
        aria-label={`Shipment progress: ${currentLabel}`}
      >
        <div className="tracking-progress__line">
          <div
            className="tracking-progress__line-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="tracking-progress__stages">
          {STAGES.map(
            (stage, index) => {
              const completed =
                index <= currentStage;
              const current =
                index === currentStage;

              return (
                <div
                  className={[
                    "tracking-progress__stage",
                    completed
                      ? "tracking-progress__stage--completed"
                      : "",
                    current
                      ? "tracking-progress__stage--current"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={stage.key}
                >
                  <div className="tracking-progress__dot">
                    {completed &&
                      index <
                        currentStage
                      ? "✓"
                      : ""}
                  </div>

                  <span>
                    {stage.label}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>

      <div className="tracking-progress__footer">
        <span>
          Current location
        </span>

        <strong>
          {latestLocation}
        </strong>
      </div>
    </section>
  );
}
