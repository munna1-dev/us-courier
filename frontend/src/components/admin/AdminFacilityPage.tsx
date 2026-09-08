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
import StatusBadge from "../common/StatusBadge";

import {
  apiDelete,
  getFacilities,
} from "../../lib/api";

import type { Facility } from "../../types";

interface AdminFacilityPageProps {
  facilityId?: string;
  className?: string;
}

type FacilityView =
  | "list"
  | "details";

function getFacilityName(
  facility: Facility
): string {
  return (
    facility.name ??
    facility.facility_name ??
    "Unnamed facility"
  );
}

function getFacilityCode(
  facility: Facility
): string {
  return (
    facility.code ??
    facility.facility_code ??
    "—"
  );
}

function getFacilityType(
  facility: Facility
): string {
  return (
    facility.type ??
    facility.facility_type ??
    "Facility"
  );
}

function getFacilityLocation(
  facility: Facility
): string {
  const fallbackLocation = [
    facility.city,
    facility.state,
    facility.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    facility.location ??
    facility.address ??
    (fallbackLocation || "—")
  );
}

function isFacilityActive(
  facility: Facility
): boolean {
  if (
    typeof facility.active ===
    "boolean"
  ) {
    return facility.active;
  }

  if (
    typeof facility.is_active ===
    "boolean"
  ) {
    return facility.is_active;
  }

  const status =
    facility.status;

  if (
    typeof status === "string"
  ) {
    return (
      status.toLowerCase() ===
      "active"
    );
  }

  return true;
}

function getFacilityId(
  facility: Facility
): string {
  return String(facility.id);
}

export default function AdminFacilityPage({
  facilityId,
  className = "",
}: AdminFacilityPageProps) {
  const [facilities, setFacilities] =
    useState<Facility[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [selectedId, setSelectedId] =
    useState<string | null>(
      facilityId ?? null
    );

  const [view, setView] =
    useState<FacilityView>(
      facilityId
        ? "details"
        : "list"
    );

  const loadFacilities =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const result =
          await getFacilities();

        setFacilities(
          Array.isArray(result)
            ? result
            : []
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load facilities."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadFacilities();
  }, [loadFacilities]);

  useEffect(() => {
    if (facilityId) {
      setSelectedId(
        facilityId
      );
      setView("details");
    }
  }, [facilityId]);

  const selectedFacility =
    useMemo(() => {
      if (!selectedId) {
        return null;
      }

      return (
        facilities.find(
          (facility) =>
            getFacilityId(
              facility
            ) === selectedId
        ) ?? null
      );
    }, [
      facilities,
      selectedId,
    ]);

  const handleSelect =
    useCallback(
      (facility: Facility) => {
        setSelectedId(
          getFacilityId(facility)
        );

        setView("details");
        setError("");
      },
      []
    );

  const handleBack =
    useCallback(() => {
      setSelectedId(null);
      setView("list");
      setError("");
    }, []);

  const handleDelete =
    useCallback(
      async (facility: Facility) => {
        const id =
          getFacilityId(facility);

        if (!id) {
          return;
        }

        const confirmed =
          window.confirm(
            `Delete ${getFacilityName(
              facility
            )}? This action cannot be undone.`
          );

        if (!confirmed) {
          return;
        }

        setDeletingId(id);
        setError("");

        try {
          await apiDelete(
            `/api/admin/facilities/${encodeURIComponent(
              id
            )}`
          );

          setFacilities(
            (current) =>
              current.filter(
                (item) =>
                  getFacilityId(
                    item
                  ) !== id
              )
          );

          if (
            selectedId === id
          ) {
            setSelectedId(null);
            setView("list");
          }
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to delete the facility."
          );
        } finally {
          setDeletingId(null);
        }
      },
      [selectedId]
    );

  const containerClassName = [
    "admin-facility-page",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <section
        className={
          containerClassName
        }
      >
        <LoadingScreen />
      </section>
    );
  }

  if (
    view === "details" &&
    selectedFacility
  ) {
    const active =
      isFacilityActive(
        selectedFacility
      );

    const selectedFacilityId =
      getFacilityId(
        selectedFacility
      );

    return (
      <section
        className={
          containerClassName
        }
      >
        <div className="admin-facility-page__toolbar">
          <div>
            <p className="admin-facility-page__eyebrow">
              Administration
            </p>

            <h2 className="admin-facility-page__title">
              Facility details
            </h2>

            <p className="admin-facility-page__description">
              Review facility information
              and administrative status.
            </p>
          </div>

          <div className="admin-facility-page__actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
            >
              ← Back to facilities
            </Button>

            <Button
              type="button"
              variant="danger"
              loading={
                deletingId ===
                selectedFacilityId
              }
              disabled={
                deletingId !== null
              }
              onClick={() =>
                void handleDelete(
                  selectedFacility
                )
              }
            >
              Delete facility
            </Button>
          </div>
        </div>

        {error && (
          <Alert
            variant="error"
            title="Facility management"
          >
            {error}
          </Alert>
        )}

        <div className="admin-facility-page__details">
          <div className="admin-facility-page__card">
            <div className="admin-facility-page__card-header">
              <div>
                <p className="admin-facility-page__label">
                  Facility
                </p>

                <h3>
                  {getFacilityName(
                    selectedFacility
                  )}
                </h3>
              </div>

              <StatusBadge
                status={
                  active
                    ? "active"
                    : "inactive"
                }
              />
            </div>

            <div className="admin-facility-page__grid">
              <div>
                <span className="admin-facility-page__field-label">
                  Facility code
                </span>

                <strong>
                  {getFacilityCode(
                    selectedFacility
                  )}
                </strong>
              </div>

              <div>
                <span className="admin-facility-page__field-label">
                  Facility type
                </span>

                <strong>
                  {getFacilityType(
                    selectedFacility
                  )}
                </strong>
              </div>

              <div>
                <span className="admin-facility-page__field-label">
                  Location
                </span>

                <strong>
                  {getFacilityLocation(
                    selectedFacility
                  )}
                </strong>
              </div>

              <div>
                <span className="admin-facility-page__field-label">
                  Status
                </span>

                <strong>
                  {active
                    ? "Active"
                    : "Inactive"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={
        containerClassName
      }
    >
      <div className="admin-facility-page__toolbar">
        <div>
          <p className="admin-facility-page__eyebrow">
            Administration
          </p>

          <h2 className="admin-facility-page__title">
            Facilities
          </h2>

          <p className="admin-facility-page__description">
            Manage courier facilities,
            locations, and operating status.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            void loadFacilities()
          }
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Facility management"
        >
          {error}
        </Alert>
      )}

      {facilities.length === 0 ? (
        <EmptyState
          title="No facilities found"
          description="There are currently no facilities available to manage."
        />
      ) : (
        <div className="admin-facility-page__list">
          {facilities.map(
            (facility) => {
              const id =
                getFacilityId(
                  facility
                );

              const active =
                isFacilityActive(
                  facility
                );

              return (
                <article
                  key={id}
                  className="admin-facility-page__item"
                >
                  <div>
                    <p className="admin-facility-page__label">
                      {getFacilityCode(
                        facility
                      )}
                    </p>

                    <h3>
                      {getFacilityName(
                        facility
                      )}
                    </h3>

                    <p>
                      {getFacilityLocation(
                        facility
                      )}
                    </p>
                  </div>

                  <div className="admin-facility-page__item-actions">
                    <StatusBadge
                      status={
                        active
                          ? "active"
                          : "inactive"
                      }
                    />

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        handleSelect(
                          facility
                        )
                      }
                    >
                      View
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      loading={
                        deletingId ===
                        id
                      }
                      disabled={
                        deletingId !==
                        null
                      }
                      onClick={() =>
                        void handleDelete(
                          facility
                        )
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}