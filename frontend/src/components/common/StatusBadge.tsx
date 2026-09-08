/* =========================================================
   Dispatch Courier
   Shipment Status Badge
   ========================================================= */

import type {
  ShipmentStatus,
} from "../../types";

import {
  getShipmentStatusLabel,
} from "../../types";


/* =========================================================
   Types
   ========================================================= */

export interface StatusBadgeProps {
  status: ShipmentStatus | string;

  size?: "small" | "medium" | "large";

  className?: string;

  showDot?: boolean;
}


/* =========================================================
   Status Normalizer
   ========================================================= */

function normalizeStatus(
  status: string
): string {
  return status
    .trim()
    .toLowerCase()
    .replace(
      /[\s-]+/g,
      "_"
    );
}


/* =========================================================
   Status Variant
   ========================================================= */

function getStatusVariant(
  status: string
): string {
  switch (
    normalizeStatus(status)
  ) {
    case "delivered":
    case "completed":
      return "success";

    case "out_for_delivery":
    case "in_transit":
    case "picked_up":
    case "picked-up":
      return "info";

    case "pending":
    case "processing":
    case "awaiting_pickup":
    case "awaiting_payment":
      return "warning";

    case "cancelled":
    case "canceled":
    case "failed":
    case "exception":
    case "returned":
      return "danger";

    default:
      return "neutral";
  }
}


/* =========================================================
   Label
   ========================================================= */

function getLabel(
  status: string
): string {
  try {
    return getShipmentStatusLabel(
      status as ShipmentStatus
    );
  } catch {
    return status
      .replace(
        /[_-]+/g,
        " "
      )
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }
}


/* =========================================================
   Component
   ========================================================= */

export default function StatusBadge({
  status,

  size = "medium",

  className = "",

  showDot = true,
}: StatusBadgeProps) {
  const normalized =
    normalizeStatus(status);

  const variant =
    getStatusVariant(
      normalized
    );

  const label =
    getLabel(status);


  const classes = [
    "status-badge",

    `status-badge--${variant}`,

    `status-badge--${size}`,

    className,
  ]
    .filter(Boolean)
    .join(" ");


  return (
    <span
      className={classes}
      data-status={normalized}
      title={label}
    >
      {showDot && (
        <span
          className="status-badge__dot"
          aria-hidden="true"
        />
      )}

      <span className="status-badge__label">
        {label}
      </span>
    </span>
  );
}