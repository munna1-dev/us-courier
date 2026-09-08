import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import Input from "../common/Input";
import LoadingScreen from "../common/LoadingScreen";
import Select from "../common/Select";
import StatusBadge from "../common/StatusBadge";

import {
  createShipment,
  deleteShipment,
  getShipments,
} from "../../lib/api";

import type {
  CreateShipmentInput,
  Shipment,
  ShipmentFilters,
} from "../../types";

interface AdminShipmentManagementProps {
  onSelectShipment?: (
    shipmentId: string,
  ) => void;
  onCreateShipment?: () => void;
  className?: string;
}

type ShipmentStatusFilter =
  | "all"
  | "pending"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned";

interface ShipmentListResponse {
  shipments: Shipment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  {
    value: "all",
    label: "All statuses",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "picked_up",
    label: "Picked up",
  },
  {
    value: "in_transit",
    label: "In transit",
  },
  {
    value: "out_for_delivery",
    label: "Out for delivery",
  },
  {
    value: "delivered",
    label: "Delivered",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
  {
    value: "returned",
    label: "Returned",
  },
];

function extractListResponse(
  response: unknown,
): ShipmentListResponse {
  if (
    !response ||
    typeof response !== "object"
  ) {
    return {
      shipments: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  }

  const root =
    response as Record<
      string,
      unknown
    >;

  let source:
    | Record<string, unknown>
    | null = root;

  if (
    root.data &&
    typeof root.data === "object" &&
    !Array.isArray(root.data)
  ) {
    source =
      root.data as Record<
        string,
        unknown
      >;
  }

  const shipments =
    Array.isArray(source.shipments)
      ? (source.shipments as Shipment[])
      : Array.isArray(source.data)
        ? (source.data as Shipment[])
        : [];

  const pagination =
    source.pagination &&
    typeof source.pagination === "object" &&
    !Array.isArray(source.pagination)
      ? (source.pagination as Record<
          string,
          unknown
        >)
      : null;

  const total = readNumber(
    pagination,
    source.total,
    "total",
  );

  const page = readNumber(
    pagination,
    source.page,
    "page",
    1,
  );

  const limit = readNumber(
    pagination,
    source.limit,
    "limit",
    20,
  );

  const totalPages = readNumber(
    pagination,
    source.totalPages,
    "total_pages",
    Math.max(
      1,
      Math.ceil(total / Math.max(limit, 1)),
    ),
  );

  return {
    shipments,
    total,
    page,
    limit,
    totalPages: Math.max(
      1,
      totalPages,
    ),
  };
}

function readNumber(
  object:
    | Record<string, unknown>
    | null,
  value: unknown,
  key?: string,
  fallback = 0,
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (
    object &&
    key &&
    object[key] !== undefined
  ) {
    const candidate =
      object[key];

    if (
      typeof candidate === "number" &&
      Number.isFinite(candidate)
    ) {
      return candidate;
    }

    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      const parsed =
        Number(candidate);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function normalizeSearch(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
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
    },
  ).format(date);
}

function getApiError(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "The shipment request could not be completed.";
}

export default function AdminShipmentManagement({
  onSelectShipment,
  onCreateShipment,
  className = "",
}: AdminShipmentManagementProps) {
  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState<ShipmentStatusFilter>(
      "all",
    );

  const [page, setPage] =
    useState(1);

  const [result, setResult] =
    useState<ShipmentListResponse>({
      shipments: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const filters =
    useMemo<ShipmentFilters>(
      () => ({
        page,
        limit: 20,
        search: search || undefined,
        status:
          status === "all"
            ? undefined
            : status,
      }),
      [page, search, status],
    );

  /*
   * Debounce only the search value.
   * The API request depends on `search`, not
   * directly on `searchInput`, preventing a
   * request for every keystroke.
   */
  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        const normalized =
          normalizeSearch(
            searchInput,
          );

        setSearch(normalized);

        setPage((currentPage) =>
          currentPage === 1
            ? currentPage
            : 1,
        );
      }, 350);

    return () =>
      window.clearTimeout(timer);
  }, [searchInput]);

  const loadShipments =
    useCallback(
      async (isRefresh = false) => {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const response =
            await getShipments(filters);

          setResult(
            extractListResponse(
              response,
            ),
          );
        } catch (err: unknown) {
          setError(
            getApiError(err),
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [filters],
    );

  useEffect(() => {
    void loadShipments();
  }, [loadShipments]);

  const handleStatusChange =
    useCallback(
      (value: string) => {
        setStatus(
          value as ShipmentStatusFilter,
        );
        setPage(1);
      },
      [],
    );

  const handleRefresh =
    useCallback(() => {
      void loadShipments(true);
    }, [loadShipments]);

  const handleDelete =
    useCallback(
      async (shipment: Shipment) => {
        const id =
          shipment.id;

        if (!id) {
          setError(
            "This shipment cannot be deleted because it has no ID.",
          );
          return;
        }

        const confirmed =
          window.confirm(
            `Delete shipment ${getShipmentIdentifier(
              shipment,
            )}? This action cannot be undone.`,
          );

        if (!confirmed) {
          return;
        }

        setDeletingId(id);
        setError("");

        try {
          await deleteShipment(id);

          setResult(
            (current) => ({
              ...current,
              shipments:
                current.shipments.filter(
                  (item) =>
                    item.id !== id,
                ),
              total: Math.max(
                0,
                current.total - 1,
              ),
            }),
          );

          await loadShipments(
            true,
          );
        } catch (err: unknown) {
          setError(
            getApiError(err),
          );
        } finally {
          setDeletingId(null);
        }
      },
      [loadShipments],
    );

  const handleCreateFallback =
    useCallback(async () => {
      /*
       * The primary create flow belongs to
       * AdminShipmentForm. This fallback is
       * intentionally conservative and is not
       * used unless the parent provides a create
       * handler.
       */
      const payload: CreateShipmentInput =
        {
          sender_name: "",
          receiver_name: "",
          origin: "",
          destination: "",
          service_type: "standard",
          package_description: "",
        };

      try {
        await createShipment(
          payload,
        );
        await loadShipments(true);
      } catch (err: unknown) {
        setError(
          getApiError(err),
        );
      }
    }, [loadShipments]);

  const handleCreate =
    useCallback(() => {
      if (onCreateShipment) {
        onCreateShipment();
        return;
      }

      void handleCreateFallback();
    }, [
      handleCreateFallback,
      onCreateShipment,
    ]);

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
          result.totalPages,
          current + 1,
        ),
      );
    }, [result.totalPages]);

  const shipments =
    result.shipments;

  return (
    <section
      className={`admin-shipment-management ${
        className
          ? `admin-shipment-management--${className}`
          : ""
      }`.trim()}
      aria-labelledby="admin-shipments-title"
    >
      <div className="dashboard-section__header">
        <div>
          <span className="page-heading__eyebrow">
            Operations
          </span>

          <h1 id="admin-shipments-title">
            Shipment Management
          </h1>

          <p>
            Search, review, update, and
            manage shipments.
          </p>
        </div>

        <div className="admin-shipment-management__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleRefresh}
            loading={refreshing}
            disabled={
              refreshing || loading
            }
          >
            Refresh
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleCreate}
          >
            Create shipment
          </Button>
        </div>
      </div>

      <div className="admin-shipment-management__filters">
        <Input
          label="Search shipments"
          value={searchInput}
          onChange={(event) =>
            setSearchInput(
              event.target.value,
            )
          }
          placeholder="Tracking number, sender, receiver..."
          hint="Search updates after a short pause."
        />

        <Select
          label="Status"
          value={status}
          onChange={(event) =>
            handleStatusChange(
              event.target.value,
            )
          }
          options={STATUS_OPTIONS}
        />
      </div>

      {error && (
        <Alert
          variant="error"
          title="Shipment management error"
          dismissible
          onDismiss={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingScreen
          message="Loading shipments..."
          fullScreen={false}
        />
      ) : shipments.length === 0 ? (
        <EmptyState
          title="No shipments found"
          description={
            search || status !== "all"
              ? "No shipments match the current search and filter."
              : "There are currently no shipments to display."
          }
          action={
            search ||
            status !== "all"
              ? {
                  label:
                    "Clear filters",
                  onClick: () => {
                    setSearchInput(
                      "",
                    );
                    setSearch("");
                    setStatus(
                      "all",
                    );
                    setPage(1);
                  },
                }
              : undefined
          }
        />
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <caption className="sr-only">
                Shipment management
                results
              </caption>

              <thead>
                <tr>
                  <th scope="col">
                    Tracking
                  </th>

                  <th scope="col">
                    Sender
                  </th>

                  <th scope="col">
                    Receiver
                  </th>

                  <th scope="col">
                    Route
                  </th>

                  <th scope="col">
                    Status
                  </th>

                  <th scope="col">
                    Delivery
                  </th>

                  <th scope="col">
                    Actions
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
                            onClick={(
                              event,
                            ) => {
                              event.preventDefault();

                              onSelectShipment?.(
                                shipment.id ||
                                  shipment.tracking_number ||
                                  "",
                              );
                            }}
                          >
                            {identifier}
                          </a>
                        </td>

                        <td>
                          {shipment.sender_name ||
                            "—"}
                        </td>

                        <td>
                          {shipment.receiver_name ||
                            "—"}
                        </td>

                        <td>
                          {shipment.origin ||
                            "—"}{" "}
                          →{" "}
                          {shipment.destination ||
                            "—"}
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
                          {formatDate(
                            shipment.estimated_delivery,
                          )}
                        </td>

                        <td>
                          <div className="data-table__actions">
                            <a
                              href={path}
                              className="button button--ghost button--small"
                              onClick={(
                                event,
                              ) => {
                                event.preventDefault();

                                onSelectShipment?.(
                                  shipment.id ||
                                    shipment.tracking_number ||
                                    "",
                                );
                              }}
                            >
                              View
                            </a>

                            <Button
                              type="button"
                              variant="danger"
                              size="small"
                              loading={
                                deletingId ===
                                shipment.id
                              }
                              disabled={
                                deletingId !==
                                  null &&
                                deletingId !==
                                  shipment.id
                              }
                              onClick={() =>
                                void handleDelete(
                                  shipment,
                                )
                              }
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <div className="pagination__info">
              Page {result.page} of{" "}
              {result.totalPages}{" "}
              · {result.total} shipments
            </div>

            <div className="pagination__actions">
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={
                  handlePrevious
                }
                disabled={
                  page <= 1 ||
                  refreshing
                }
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={
                  handleNext
                }
                disabled={
                  page >=
                    result.totalPages ||
                  refreshing
                }
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