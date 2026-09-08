import type { MouseEvent } from "react";

import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";

import type { Shipment } from "../../types";

interface AdminShipmentTableProps {
  shipments?: Shipment[];
  loading?: boolean;
  onSelect?: (
    shipment: Shipment,
  ) => void;
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

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function getShipmentIdentifier(
  shipment: Shipment,
): string {
  return (
    shipment.tracking_number ||
    shipment.id ||
    "—"
  );
}

function getRoute(
  shipment: Shipment,
): string {
  const origin =
    shipment.origin?.trim() || "Unknown origin";

  const destination =
    shipment.destination?.trim() ||
    "Unknown destination";

  return `${origin} → ${destination}`;
}

function getShipmentPath(
  shipment: Shipment,
): string {
  const identifier =
    shipment.id ||
    shipment.tracking_number;

  if (!identifier) {
    return "/admin/shipments";
  }

  return `/admin/shipments/${encodeURIComponent(
    identifier,
  )}`;
}

export default function AdminShipmentTable({
  shipments = [],
  loading = false,
  onSelect,
  className = "",
}: AdminShipmentTableProps) {
  const handleSelect = (
    event: MouseEvent<
      HTMLAnchorElement
    >,
    shipment: Shipment,
  ) => {
    event.preventDefault();

    if (onSelect) {
      onSelect(shipment);
      return;
    }

    const path =
      getShipmentPath(shipment);

    const currentPath =
      window.location.pathname.replace(
        /\/+$/,
        "",
      ) || "/";

    if (currentPath === path) {
      return;
    }

    window.history.pushState(
      {},
      "",
      path,
    );

    window.dispatchEvent(
      new PopStateEvent("popstate"),
    );
  };

  if (loading) {
    return (
      <div
        className={`admin-shipment-table admin-shipment-table--loading ${
          className
            ? `admin-shipment-table--${className}`
            : ""
        }`.trim()}
      >
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Route</th>
                <th>Status</th>
                <th>Service</th>
                <th>Estimated delivery</th>
              </tr>
            </thead>

            <tbody>
              {Array.from(
                { length: 5 },
                (_, index) => (
                  <tr key={index}>
                    <td>
                      <span className="skeleton">
                        &nbsp;
                      </span>
                    </td>

                    <td>
                      <span className="skeleton">
                        &nbsp;
                      </span>
                    </td>

                    <td>
                      <span className="skeleton">
                        &nbsp;
                      </span>
                    </td>

                    <td>
                      <span className="skeleton">
                        &nbsp;
                      </span>
                    </td>

                    <td>
                      <span className="skeleton">
                        &nbsp;
                      </span>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!shipments.length) {
    return (
      <div
        className={`admin-shipment-table ${
          className
            ? `admin-shipment-table--${className}`
            : ""
        }`.trim()}
      >
        <EmptyState
          title="No shipments found"
          description="There are no shipments available to display."
        />
      </div>
    );
  }

  return (
    <div
      className={`admin-shipment-table ${
        className
          ? `admin-shipment-table--${className}`
          : ""
      }`.trim()}
    >
      <div className="table-container">
        <table className="data-table">
          <caption className="sr-only">
            Recent shipments
          </caption>

          <thead>
            <tr>
              <th scope="col">
                Tracking
              </th>

              <th scope="col">
                Route
              </th>

              <th scope="col">
                Status
              </th>

              <th scope="col">
                Service
              </th>

              <th scope="col">
                Estimated delivery
              </th>

              <th
                scope="col"
                className="data-table__actions-heading"
              >
                <span className="sr-only">
                  Actions
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {shipments.map(
              (shipment) => {
                const identifier =
                  getShipmentIdentifier(
                    shipment,
                  );

                const path =
                  getShipmentPath(
                    shipment,
                  );

                return (
                  <tr
                    key={
                      shipment.id ||
                      shipment.tracking_number ||
                      identifier
                    }
                  >
                    <td>
                      <a
                        href={path}
                        className="data-table__primary-link"
                        onClick={(event) =>
                          handleSelect(
                            event,
                            shipment,
                          )
                        }
                      >
                        {identifier}
                      </a>
                    </td>

                    <td>
                      <span className="data-table__route">
                        {getRoute(
                          shipment,
                        )}
                      </span>
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          shipment.status
                        }
                        size="small"
                      />
                    </td>

                    <td>
                      {shipment.service_type ||
                        "Standard"}
                    </td>

                    <td>
                      {formatDate(
                        shipment.estimated_delivery,
                      )}
                    </td>

                    <td className="data-table__actions">
                      <a
                        href={path}
                        className="button button--ghost button--small"
                        onClick={(event) =>
                          handleSelect(
                            event,
                            shipment,
                          )
                        }
                      >
                        View
                      </a>
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}