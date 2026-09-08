import type { Shipment } from "../../types";

interface ShipmentSummaryProps {
  shipment: Shipment | null;
  className?: string;
}

function displayValue(
  value?: string | number | null
): string {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "—";
  }

  return String(value);
}

function getTrackingNumber(
  shipment: Shipment
): string {
  return (
    shipment.tracking_number ??
    shipment.trackingNumber ??
    "—"
  );
}

function getRecipientName(
  shipment: Shipment
): string {
  return (
    shipment.recipient_name ??
    shipment.receiver_name ??
    shipment.recipientName ??
    "—"
  );
}

function getOrigin(
  shipment: Shipment
): string {
  return (
    shipment.origin ??
    shipment.origin_address ??
    shipment.originAddress ??
    "—"
  );
}

function getDestination(
  shipment: Shipment
): string {
  return (
    shipment.destination ??
    shipment.destination_address ??
    shipment.destinationAddress ??
    "—"
  );
}

function getEstimatedDelivery(
  shipment: Shipment
): string {
  return (
    shipment.estimated_delivery_date ??
    shipment.estimatedDeliveryDate ??
    shipment.estimated_delivery ??
    shipment.estimatedDelivery ??
    "—"
  );
}

export default function ShipmentSummary({
  shipment,
  className = "",
}: ShipmentSummaryProps) {
  if (!shipment) {
    return (
      <section
        className={[
          "shipment-summary",
          "shipment-summary--empty",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <p>No shipment information available.</p>
      </section>
    );
  }

  const status =
    shipment.status ?? "unknown";

  return (
    <section
      className={[
        "shipment-summary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Shipment summary"
    >
      <div className="shipment-summary__header">
        <div>
          <p className="shipment-summary__eyebrow">
            Shipment
          </p>

          <h3 className="shipment-summary__tracking">
            {getTrackingNumber(shipment)}
          </h3>
        </div>

        <span
          className={[
            "shipment-summary__status",
            `shipment-summary__status--${String(
              status
            ).toLowerCase()}`,
          ].join(" ")}
        >
          {String(status).replace(
            /_/g,
            " "
          )}
        </span>
      </div>

      <div className="shipment-summary__grid">
        <div className="shipment-summary__item">
          <span className="shipment-summary__label">
            Recipient
          </span>

          <strong className="shipment-summary__value">
            {getRecipientName(shipment)}
          </strong>
        </div>

        <div className="shipment-summary__item">
          <span className="shipment-summary__label">
            Reference
          </span>

          <strong className="shipment-summary__value">
            {displayValue(
              shipment.reference_number ??
                shipment.referenceNumber
            )}
          </strong>
        </div>

        <div className="shipment-summary__item">
          <span className="shipment-summary__label">
            Origin
          </span>

          <strong className="shipment-summary__value">
            {getOrigin(shipment)}
          </strong>
        </div>

        <div className="shipment-summary__item">
          <span className="shipment-summary__label">
            Destination
          </span>

          <strong className="shipment-summary__value">
            {getDestination(shipment)}
          </strong>
        </div>

        <div className="shipment-summary__item">
          <span className="shipment-summary__label">
            Service
          </span>

          <strong className="shipment-summary__value">
            {displayValue(
              shipment.service_type ??
                shipment.serviceType
            )}
          </strong>
        </div>

        <div className="shipment-summary__item">
          <span className="shipment-summary__label">
            Estimated delivery
          </span>

          <strong className="shipment-summary__value">
            {getEstimatedDelivery(shipment)}
          </strong>
        </div>
      </div>
    </section>
  );
}