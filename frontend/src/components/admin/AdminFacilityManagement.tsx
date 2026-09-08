import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import Input from "../common/Input";
import LoadingScreen from "../common/LoadingScreen";
import StatusBadge from "../common/StatusBadge";

import { apiDelete, getFacilities } from "../../lib/api";
import type { Facility } from "../../types";

interface AdminFacilityManagementProps {
  onSelectFacility?: (facilityId: string) => void;
  onCreateFacility?: () => void;
  onEditFacility?: (facilityId: string) => void;
  className?: string;
}

interface FacilityListResponse {
  facilities?: Facility[];
  data?: Facility[] | { facilities?: Facility[] };
  items?: Facility[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  };
}

function getPayload(value: unknown): FacilityListResponse {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as FacilityListResponse;
}

function extractFacilities(value: unknown): Facility[] {
  const payload = getPayload(value);

  if (Array.isArray(payload.facilities)) {
    return payload.facilities;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (
    payload.data &&
    typeof payload.data === "object" &&
    Array.isArray(payload.data.facilities)
  ) {
    return payload.data.facilities;
  }

  return [];
}

function extractPagination(value: unknown) {
  const payload = getPayload(value);
  const pagination = payload.pagination ?? payload.meta;

  return {
    page:
      Number(pagination?.page) > 0
        ? Number(pagination?.page)
        : 1,
    limit:
      Number(pagination?.limit) > 0
        ? Number(pagination?.limit)
        : 20,
    total:
      Number(pagination?.total) >= 0
        ? Number(pagination?.total)
        : 0,
    totalPages:
      Number(pagination?.totalPages ?? pagination?.total_pages) > 0
        ? Number(
            pagination?.totalPages ??
              pagination?.total_pages,
          )
        : 1,
  };
}

function getFacilityIdentifier(facility: Facility): string {
  return String(
    facility.id ??
      facility.code ??
      facility.name ??
      "",
  );
}

function getFacilityName(facility: Facility): string {
  return String(
    facility.name ??
      facility.facility_name ??
      facility.code ??
      "Unnamed facility",
  );
}

function getFacilityCode(facility: Facility): string {
  return String(
    facility.code ??
      facility.facility_code ??
      "—",
  );
}

function getFacilityLocation(facility: Facility): string {
  return String(
    facility.address ??
      facility.location ??
      facility.city ??
      facility.state ??
      "—",
  );
}

function getFacilityType(facility: Facility): string {
  return String(
    facility.type ??
      facility.facility_type ??
      facility.category ??
      "Facility",
  );
}

function isFacilityActive(facility: Facility): boolean {
  if (typeof facility.is_active === "boolean") {
    return facility.is_active;
  }

  if (typeof facility.active === "boolean") {
    return facility.active;
  }

  const status = String(facility.status ?? "").toLowerCase();

  if (status) {
    return !["inactive", "disabled", "closed", "cancelled"].includes(
      status,
    );
  }

  return true;
}

export default function AdminFacilityManagement({
  onSelectFacility,
  onCreateFacility,
  onEditFacility,
  className = "",
}: AdminFacilityManagementProps) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  const loadFacilities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getFacilities({
        page,
        limit,
        search: search || undefined,
      });

      const extracted = extractFacilities(response);

      const filtered =
        statusFilter === "all"
          ? extracted
          : extracted.filter((facility) =>
              statusFilter === "active"
                ? isFacilityActive(facility)
                : !isFacilityActive(facility),
            );

      setFacilities(filtered);
      setPagination(extractPagination(response));
    } catch (err) {
      setFacilities([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load facilities.",
      );
    } finally {
      setLoading(false);
    }
  }, [limit, page, search, statusFilter]);

  useEffect(() => {
    void loadFacilities();
  }, [loadFacilities]);

  const visibleFacilities = useMemo(
    () => facilities,
    [facilities],
  );

  const handleSelect = useCallback(
    (facilityId: string) => {
      if (onSelectFacility) {
        onSelectFacility(facilityId);
        return;
      }

      const path = `/admin/facilities/${encodeURIComponent(
        facilityId,
      )}`;

      if (window.location.pathname === path) {
        return;
      }

      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    [onSelectFacility],
  );

  const handleEdit = useCallback(
    (event: MouseEvent<HTMLButtonElement>, facilityId: string) => {
      event.stopPropagation();

      if (onEditFacility) {
        onEditFacility(facilityId);
        return;
      }

      const path = `/admin/facilities/${encodeURIComponent(
        facilityId,
      )}/edit`;

      if (window.location.pathname === path) {
        return;
      }

      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    [onEditFacility],
  );

  const handleDelete = useCallback(
    async (
      event: MouseEvent<HTMLButtonElement>,
      facility: Facility,
    ) => {
      event.stopPropagation();

      const identifier = getFacilityIdentifier(facility);

      if (!identifier || deletingId) {
        return;
      }

      const confirmed = window.confirm(
        `Remove ${getFacilityName(facility)}? This action cannot be undone.`,
      );

      if (!confirmed) {
        return;
      }

      setDeletingId(identifier);
      setError("");
      setSuccess("");

      try {
        await apiDelete(
          `/api/facilities/${encodeURIComponent(identifier)}`,
        );

        setSuccess("Facility removed successfully.");
        await loadFacilities();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to remove the facility.",
        );
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, loadFacilities],
  );

  const handlePrevious = useCallback(() => {
    if (page <= 1 || loading) {
      return;
    }

    setPage((current) => Math.max(1, current - 1));
  }, [loading, page]);

  const handleNext = useCallback(() => {
    if (
      loading ||
      page >= pagination.totalPages
    ) {
      return;
    }

    setPage((current) => current + 1);
  }, [loading, page, pagination.totalPages]);

  const handleRefresh = useCallback(() => {
    setSuccess("");
    void loadFacilities();
  }, [loadFacilities]);

  if (loading && facilities.length === 0) {
    return (
      <section className={`admin-facility-management ${className}`.trim()}>
        <div className="page-heading">
          <h1>Facility Management</h1>
          <p>
            Manage courier facilities, hubs, warehouses, and
            operational locations.
          </p>
        </div>

        <LoadingScreen
          message="Loading facilities..."
          fullScreen={false}
        />
      </section>
    );
  }

  return (
    <section
      className={`admin-facility-management ${className}`.trim()}
    >
      <div className="page-heading">
        <div>
          <h1>Facility Management</h1>
          <p>
            Manage courier facilities, hubs, warehouses, and
            operational locations.
          </p>
        </div>

        <div className="page-heading__actions">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>

          {onCreateFacility && (
            <Button
              variant="primary"
              onClick={onCreateFacility}
            >
              Add facility
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Facility management error"
          dismissible
          onDismiss={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          title="Success"
          dismissible
          onDismiss={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      <div className="admin-filter-bar">
        <Input
          label="Search facilities"
          value={searchInput}
          onChange={(event) =>
            setSearchInput(event.target.value)
          }
          placeholder="Search by name, code, or location"
        />

        <label className="form-field">
          <span className="form-field__label">
            Status
          </span>

          <select
            className="form-field__input"
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(
                event.target.value as
                  | "all"
                  | "active"
                  | "inactive",
              );
            }}
          >
            <option value="all">All facilities</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      {visibleFacilities.length === 0 ? (
        <EmptyState
          title="No facilities found"
          description={
            search
              ? "No facilities match your search."
              : "There are no facilities available yet."
          }
          action={
            onCreateFacility
              ? {
                  label: "Add facility",
                  onClick: onCreateFacility,
                }
              : undefined
          }
        />
      ) : (
        <>
          <div className="admin-table-card">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Facility</th>
                    <th scope="col">Code</th>
                    <th scope="col">Location</th>
                    <th scope="col">Type</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleFacilities.map((facility) => {
                    const identifier =
                      getFacilityIdentifier(facility);
                    const active =
                      isFacilityActive(facility);

                    return (
                      <tr
                        key={identifier}
                        className="data-table__clickable-row"
                        onClick={() =>
                          handleSelect(identifier)
                        }
                      >
                        <td>
                          <strong>
                            {getFacilityName(facility)}
                          </strong>
                        </td>

                        <td>
                          {getFacilityCode(facility)}
                        </td>

                        <td>
                          {getFacilityLocation(facility)}
                        </td>

                        <td>
                          {getFacilityType(facility)}
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              active
                                ? "delivered"
                                : "cancelled"
                            }
                          />

                          <span className="sr-only">
                            {active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div className="table-actions">
                            <Button
                              variant="ghost"
                              size="small"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSelect(
                                  identifier,
                                );
                              }}
                            >
                              View
                            </Button>

                            <Button
                              variant="secondary"
                              size="small"
                              onClick={(event) =>
                                handleEdit(
                                  event,
                                  identifier,
                                )
                              }
                            >
                              Edit
                            </Button>

                            <Button
                              variant="danger"
                              size="small"
                              loading={
                                deletingId === identifier
                              }
                              disabled={
                                deletingId !== null
                              }
                              onClick={(event) =>
                                void handleDelete(
                                  event,
                                  facility,
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pagination">
            <span className="pagination__summary">
              {pagination.total > 0
                ? `Showing page ${pagination.page} of ${pagination.totalPages}`
                : `Page ${page}`}
            </span>

            <div className="pagination__actions">
              <Button
                variant="secondary"
                size="small"
                disabled={page <= 1 || loading}
                onClick={handlePrevious}
              >
                Previous
              </Button>

              <Button
                variant="secondary"
                size="small"
                disabled={
                  loading ||
                  page >= pagination.totalPages
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