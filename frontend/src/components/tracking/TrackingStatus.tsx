import type {
  TrackingResult,
} from "../../types";

interface TrackingStatusProps {
  result: TrackingResult;
}

function labelStatus(
  value: string,
): string {
  return value
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

export default function TrackingStatus({
  result,
}: TrackingStatusProps) {
  const shipment =
    result.shipment;

  /*
   * TrackingResult can represent a lookup
   * where no shipment was returned.
   */
  if (!shipment) {
    return null;
  }

  const status =
    shipment.status ||
    "pending";

  const location =
    shipment.current_location ??
    shipment.currentLocation ??
    "In transit";

  const estimated =
    shipment.estimated_delivery_date ??
    shipment.estimatedDeliveryDate;

  return (
    <section className="tracking-card tracking-status">
      <div className="tracking-status__top">
        <div>
          <p className="page-eyebrow">
            Tracking number
          </p>

          <h2>
            {shipment.tracking_number}
          </h2>
        </div>

        <span
          className={`status-badge status-badge--${status}`}
        >
          {labelStatus(status)}
        </span>
      </div>

      <div className="tracking-status__grid">
        <div>
          <span>
            Current location
          </span>

          <strong>
            {location}
          </strong>
        </div>

        <div>
          <span>
            Estimated delivery
          </span>

          <strong>
            {estimated
              ? new Date(
                  estimated,
                ).toLocaleDateString()
              : "Updating"}
          </strong>
        </div>

        <div>
          <span>
            Recipient
          </span>

          <strong>
            {shipment.recipient_name ??
              shipment.recipientName ??
              "—"}
          </strong>
        </div>
      </div>
    </section>
  );
}