import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import LoadingScreen from "../common/LoadingScreen";
import Select from "../common/Select";
import StatusBadge from "../common/StatusBadge";
import Input from "../common/Input";

import { getShipments } from "../../lib/api";

import type {
  Shipment,
  ShipmentFilters,
} from "../../types";

interface ShipmentListProps {
  onSelectShipment?: (shipmentId: string) => void;
  className?: string;
}

interface ShipmentResponse {
  data?: Shipment[];
  shipments?: Shipment[];
  total?: number;
  count?: number;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  };
}

const PAGE_SIZE = 10;

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "in_transit", label: "In transit" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function extractResponse(
  response: unknown,
): {
  shipments: Shipment[];
  total: number;
} {
  if (!response || typeof response !== "object") {
    return {
      shipments: [],
      total: 0,
    };
  }

  const value = response as ShipmentResponse;

  let shipments: Shipment[] = [];

  if (Array.isArray(value.data)) {
    shipments = value.data;
  } else if (Array.isArray(value.shipments)) {
    shipments = value.shipments;
  }

  const paginationTotal =
    value.pagination?.total;

  const directTotal =
    value.total ?? value.count;

  const total =
    typeof paginationTotal === "number"
      ? paginationTotal
      : typeof directTotal === "number"
        ? directTotal
        : shipments.length;

  return {
    shipments,
    total,
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

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getShipmentIdentifier(
  shipment: Shipment,
): string {
  return (
    shipment.tracking_number ||
    shipment.id ||
    ""
  );
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

export default function ShipmentList({
  onSelectShipment,
  className = "",
}: ShipmentListProps) {
  const [shipments, setShipments] =
    useState<Shipment[]>([]);

  const [page, setPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [retryKey, setRetryKey] =
    useState(0);

  /*
   * Keep the API filter object stable so that
   * changing unrelated component state does not
   * trigger duplicate requests.
   */
  const filters = useMemo<ShipmentFilters>(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      status: status || undefined,
    }),
    [page, search, status],
  );

  const loadShipments = useCallback(
    async (
      requestFilters: ShipmentFilters,
    ) => {
      setLoading(true);
      setError("");

      try {
        const response =
          await getShipments(
            requestFilters,
          );

        const result =
          extractResponse(response);

        setShipments(result.shipments);
        setTotal(result.total);
      } catch (err: unknown) {
        const message =
          err instanceof Error &&
          err.message.trim()
            ? err.message
            : "Unable to load your shipments.";

        setError(message);
        setShipments([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await getShipments(filters);

        if (cancelled) return;

        const result =
          extractResponse(response);

        setShipments(result.shipments);
        setTotal(result.total);
      } catch (err: unknown) {
        if (cancelled) return;

        const message =
          err instanceof Error &&
          err.message.trim()
            ? err.message
            : "Unable to load your shipments.";

        setError(message);
        setShipments([]);
        setTotal(0);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [filters, retryKey]);

  /*
   * Search is intentionally debounced. We update the
   * page immediately, then wait before issuing the
   * request so rapid typing cannot create a request
   * for every character.
   */
  useEffect(() => {
    const timeout =
      window.setTimeout(() => {
        setPage(1);
      }, 350);

    return () =>
      window.clearTimeout(timeout);
  }, [search]);

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE),
  );

  const handleSearchChange =
    useCallback(
      (value: string) => {
        setSearch(value);
      },
      [],
    );

  const handleStatusChange =
    useCallback(
      (value: string) => {
        setStatus(value);
        setPage(1);
      },
      [],
    );

  const handleRetry =
    useCallback(() => {
      setRetryKey((current) => current + 1);
    }, []);

  const handlePrevious =
    useCallback(() => {
      setPage((current) =>
        Math.max(1, current - 1),
      );
    }, []);

  const handleNext =
    useCallback(() => {
      setPage((current) =>
        Math.min(
          totalPages,
          current + 1,
        ),
      );
    }, [totalPages]);

  const handleShipmentClick =
    useCallback(
      (shipment: Shipment) => {
        const identifier =
          getShipmentIdentifier(
            shipment,
          );

        if (!identifier) return;

        onSelectShipment?.(
          identifier,
        );
      },
      [onSelectShipment],
    );

  const headingClassName = [
    "dashboard-section",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={headingClassName}
      aria-labelledby="shipments-title"
    >
      <div className="dashboard-section__header">
        <div>
          <h1 id="shipments-title">
            My Shipments
          </h1>
          <p>
            View and manage shipments
            associated with your account.
          </p>
        </div>
      </div>

      <div className="shipment-list__filters">
        <Input
          label="Search shipments"
          value={search}
          onChange={(event) =>
            handleSearchChange(
              event.target.value,
            )
          }
          placeholder="Search by tracking number"
          hint="Search updates automatically."
        />

        <Select
          label="Status"
          value={status}
          options={statusOptions}
          onChange={(event) =>
            handleStatusChange(
              event.target.value,
            )
          }
        />
      </div>

      {error && (
        <Alert
          variant="error"
          title="Unable to load shipments"
        >
          <p>{error}</p>

          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={handleRetry}
          >
            Try again
          </Button>
        </Alert>
      )}

      {loading ? (
        <LoadingScreen
          message="Loading your shipments..."
        />
      ) : shipments.length === 0 ? (
        <EmptyState
          title={
            search.trim() || status
              ? "No matching shipments"
              : "No shipments yet"
          }
          description={
            search.trim() || status
              ? "Try changing your search or status filter."
              : "Your shipment activity will appear here once you have a shipment."
          }
        />
      ) : (
        <>
          <div className="shipment-list">
            <div className="table-container">
              <table>
                <caption className="sr-only">
                  Shipments associated with
                  your account
                </caption>

                <thead>
                  <tr>
                    <th scope="col">
                      Tracking number
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
                  </tr>
                </thead>

                <tbody>
                  {shipments.map(
                    (shipment) => {
                      const identifier =
                        getShipmentIdentifier(
                          shipment,
                        );

                      return (
                        <tr
                          key={
                            shipment.id ||
                            shipment.tracking_number
                          }
                        >
                          <td>
                            {identifier ? (
                              <button
                                type="button"
                                className="shipment-list__tracking"
                                onClick={() =>
                                  handleShipmentClick(
                                    shipment,
                                  )
                                }
                              >
                                {identifier}
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td>
                            <div className="shipment-list__route">
                              <span>
                                {shipment.origin ||
                                  "—"}
                              </span>

                              <span
                                aria-hidden="true"
                              >
                                →
                              </span>

                              <span>
                                {shipment.destination ||
                                  "—"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <StatusBadge
                              status={
                                shipment.status
                              }
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
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className="shipment-list__pagination"
            aria-label="Shipment pagination"
          >
            <span>
              Page {page} of{" "}
              {totalPages}
            </span>

            <div className="shipment-list__pagination-actions">
              <Button
                type="button"
                variant="secondary"
                size="small"
                disabled={
                  page <= 1 || loading
                }
                onClick={
                  handlePrevious
                }
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="small"
                disabled={
                  page >= totalPages ||
                  loading
                }
                onClick={handleNext}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}