import { useCallback } from "react";
import type { MouseEvent } from "react";

import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";
import type { Shipment } from "../../types";

interface ShipmentTableProps {
  shipments: Shipment[];
  loading?: boolean;
  onSelect?: (shipment: Shipment) => void;
  className?: string;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getShipmentPath(shipment: Shipment): string {
  const identifier =
    shipment.tracking_number || shipment.id;

  if (!identifier) {
    return "/dashboard/shipments";
  }

  return `/dashboard/shipments/${encodeURIComponent(
    identifier,
  )}`;
}

function getServiceLabel(
  serviceType?: string | null,
): string {
  if (!serviceType) return "Standard";

  return serviceType
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default function ShipmentTable({
  shipments,
  loading = false,
  onSelect,
  className = "",
}: ShipmentTableProps) {
  const handleSelect = useCallback(
    (
      event: MouseEvent<HTMLAnchorElement>,
      shipment: Shipment,
    ) => {
      /*
       * If the parent owns navigation, let it control
       * history so that one click creates one entry.
       */
      if (onSelect) {
        event.preventDefault();
        onSelect(shipment);
        return;
      }

      /*
       * Fallback internal navigation.
       * Never add a history entry when the destination
       * is already the current route.
       */
      const nextPath = getShipmentPath(shipment);

      if (
        !nextPath.startsWith("/") ||
        nextPath.startsWith("//")
      ) {
        return;
      }

      const currentPath =
        window.location.pathname.replace(/\/+$/, "") ||
        "/";

      if (currentPath === nextPath) {
        event.preventDefault();
        return;
      }

      event.preventDefault();

      window.history.pushState(
        {},
        "",
        nextPath,
      );

      window.dispatchEvent(
        new PopStateEvent("popstate"),
      );
    },
    [onSelect],
  );

  if (loading) {
    return (
      <div
        className={`shipment-table shipment-table--loading ${
          className
            ? `shipment-table--${className}`
            : ""
        }`.trim()}
        aria-busy="true"
        aria-label="Loading shipments"
      >
        <div className="shipment-table__loading">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading shipments...</span>
        </div>
      </div>
    );
  }

  if (!shipments.length) {
    return (
      <EmptyState
        title="No shipments found"
        description="There are no shipments to display."
        className={className}
      />
    );
  }

  return (
    <div
      className={`shipment-table ${
        className
          ? `shipment-table--${className}`
          : ""
      }`.trim()}
    >
      <div className="table-container">
        <table>
          <caption className="sr-only">
            Your recent shipments
          </caption>

          <thead>
            <tr>
              <th scope="col">Tracking number</th>
              <th scope="col">Route</th>
              <th scope="col">Status</th>
              <th scope="col">Service</th>
              <th scope="col">Estimated delivery</th>
            </tr>
          </thead>

          <tbody>
            {shipments.map((shipment) => {
              const identifier =
                shipment.tracking_number ||
                shipment.id ||
                "—";

              const destination =
                shipment.destination || "—";

              const origin =
                shipment.origin || "—";

              return (
                <tr
                  key={
                    shipment.id ||
                    shipment.tracking_number ||
                    `${origin}-${destination}`
                  }
                >
                  <td>
                    {shipment.id ||
                    shipment.tracking_number ? (
                      <a
                        href={getShipmentPath(
                          shipment,
                        )}
                        className="shipment-table__tracking"
                        onClick={(event) =>
                          handleSelect(
                            event,
                            shipment,
                          )
                        }
                      >
                        {identifier}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    <div className="shipment-table__route">
                      <span>
                        {origin}
                      </span>

                      <span
                        className="shipment-table__route-arrow"
                        aria-hidden="true"
                      >
                        →
                      </span>

                      <span>
                        {destination}
                      </span>
                    </div>
                  </td>

                  <td>
                    <StatusBadge
                      status={shipment.status}
                    />
                  </td>

                  <td>
                    {getServiceLabel(
                      shipment.service_type,
                    )}
                  </td>

                  <td>
                    {formatDate(
                      shipment.estimated_delivery,
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}