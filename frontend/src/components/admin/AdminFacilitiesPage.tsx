import {
  useCallback,
  useEffect,
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

interface FacilityListResponse {
  facilities?: Facility[];
  data?: Facility[] | { facilities?: Facility[] };
  items?: Facility[];
}

function extractFacilities(
  value: unknown,
): Facility[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const payload =
    value as FacilityListResponse;

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

function getValue(
  facility: Facility,
  ...keys: string[]
): string {
  const record =
    facility as unknown as Record<
      string,
      unknown
    >;

  for (const key of keys) {
    const value = record[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim()
    ) {
      return String(value);
    }
  }

  return "—";
}

function getIdentifier(
  facility: Facility,
): string {
  return String(
    facility.id ??
      facility.code ??
      facility.name ??
      "",
  );
}

function isActive(
  facility: Facility,
): boolean {
  const record =
    facility as unknown as Record<
      string,
      unknown
    >;

  if (
    typeof record.is_active === "boolean"
  ) {
    return record.is_active;
  }

  if (
    typeof record.active === "boolean"
  ) {
    return record.active;
  }

  const status = String(
    record.status ?? "",
  ).toLowerCase();

  if (status) {
    return ![
      "inactive",
      "disabled",
      "closed",
      "cancelled",
    ].includes(status);
  }

  return true;
}

export default function AdminFacilityPage({
  facilityId,
  className = "",
}: AdminFacilityPageProps) {
  const [facility, setFacility] =
    useState<Facility>();

  const [loading, setLoading] =
    useState(true);

  const [removing, setRemoving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadFacility =
    useCallback(async () => {
      if (!facilityId) {
        setFacility(undefined);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await getFacilities({
            search: facilityId,
            page: 1,
            limit: 100,
          });

        const facilities =
          extractFacilities(response);

        const normalized =
          facilityId.toLowerCase();

        const exact =
          facilities.find(
            (item) => {
              const identifier =
                getIdentifier(
                  item,
                ).toLowerCase();

              const code = String(
                (
                  item as unknown as Record<
                    string,
                    unknown
                  >
                ).code ?? "",
              ).toLowerCase();

              return (
                identifier === normalized ||
                code === normalized
              );
            },
          ) ?? facilities[0];

        if (!exact) {
          throw new Error(
            "Facility not found.",
          );
        }

        setFacility(exact);
      } catch (err) {
        setFacility(undefined);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load facility.",
        );
      } finally {
        setLoading(false);
      }
    }, [facilityId]);

  useEffect(() => {
    void loadFacility();
  }, [loadFacility]);

  const handleBack =
    useCallback(() => {
      const path =
        "/admin/facilities";

      if (
        window.location.pathname ===
        path
      ) {
        return;
      }

      window.history.pushState(
        {},
        "",
        path,
      );

      window.dispatchEvent(
        new PopStateEvent(
          "popstate",
        ),
      );
    }, []);

  const handleEdit =
    useCallback(() => {
      if (!facility) {
        return;
      }

      const identifier =
        getIdentifier(facility);

      if (!identifier) {
        return;
      }

      const path =
        `/admin/facilities/${encodeURIComponent(
          identifier,
        )}/edit`;

      if (
        window.location.pathname ===
        path
      ) {
        return;
      }

      window.history.pushState(
        {},
        "",
        path,
      );

      window.dispatchEvent(
        new PopStateEvent(
          "popstate",
        ),
      );
    }, [facility]);

  const handleRemove =
    useCallback(async () => {
      if (!facility || removing) {
        return;
      }

      const identifier =
        getIdentifier(facility);

      if (!identifier) {
        setError(
          "This facility does not have a valid identifier.",
        );
        return;
      }

      const name =
        getValue(
          facility,
          "name",
          "facility_name",
          "code",
        );

      const confirmed =
        window.confirm(
          `Remove ${name}? This action cannot be undone.`,
        );

      if (!confirmed) {
        return;
      }

      setRemoving(true);
      setError("");
      setSuccess("");

      try {
        await apiDelete(
          `/api/facilities/${encodeURIComponent(
            identifier,
          )}`,
        );

        setSuccess(
          "Facility removed successfully.",
        );

        window.history.replaceState(
          {},
          "",
          "/admin/facilities",
        );

        window.dispatchEvent(
          new PopStateEvent(
            "popstate",
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to remove facility.",
        );
      } finally {
        setRemoving(false);
      }
    }, [facility, removing]);

  if (loading) {
    return (
      <section
        className={`admin-facility-page ${className}`.trim()}
      >
        <LoadingScreen
          message="Loading facility..."
          fullScreen={false}
        />
      </section>
    );
  }

  if (!facility) {
    return (
      <section
        className={`admin-facility-page ${className}`.trim()}
      >
        {error && (
          <Alert
            variant="error"
            title="Facility unavailable"
            dismissible
            onDismiss={() =>
              setError("")
            }
          >
            {error}
          </Alert>
        )}

        <EmptyState
          title="Facility not found"
          description="The requested facility could not be found."
          action={{
            label: "Back to facilities",
            onClick: handleBack,
          }}
        />
      </section>
    );
  }

  const active = isActive(facility);

  const facilityName =
    getValue(
      facility,
      "name",
      "facility_name",
      "code",
    );

  return (
    <section
      className={`admin-facility-page ${className}`.trim()}
    >
      <div className="page-heading">
        <div>
          <h1>{facilityName}</h1>

          <p>
            Facility details and operational
            information.
          </p>
        </div>

        <div className="page-heading__actions">
          <Button
            variant="secondary"
            onClick={handleBack}
          >
            Back
          </Button>

          <Button
            variant="secondary"
            onClick={handleEdit}
          >
            Edit
          </Button>

          <Button
            variant="danger"
            loading={removing}
            onClick={() =>
              void handleRemove()
            }
          >
            Remove
          </Button>
        </div>
      </div>

      {success && (
        <Alert
          variant="success"
          title="Success"
          dismissible
          onDismiss={() =>
            setSuccess("")
          }
        >
          {success}
        </Alert>
      )}

      {error && (
        <Alert
          variant="error"
          title="Facility error"
          dismissible
          onDismiss={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      <div className="admin-detail-grid">
        <article className="detail-card">
          <div className="detail-card__header">
            <div>
              <h2>Facility information</h2>
              <p>
                Basic identification and
                classification.
              </p>
            </div>

            <StatusBadge
              status={
                active
                  ? "delivered"
                  : "cancelled"
              }
            />
          </div>

          <dl className="detail-list">
            <div>
              <dt>Name</dt>
              <dd>
                {facilityName}
              </dd>
            </div>

            <div>
              <dt>Facility code</dt>
              <dd>
                {getValue(
                  facility,
                  "code",
                  "facility_code",
                )}
              </dd>
            </div>

            <div>
              <dt>Type</dt>
              <dd>
                {getValue(
                  facility,
                  "type",
                  "facility_type",
                  "category",
                )}
              </dd>
            </div>

            <div>
              <dt>Status</dt>
              <dd>
                {active
                  ? "Active"
                  : "Inactive"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="detail-card">
          <div className="detail-card__header">
            <div>
              <h2>Location</h2>
              <p>
                Facility address and region.
              </p>
            </div>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Address</dt>
              <dd>
                {getValue(
                  facility,
                  "address",
                  "address_line1",
                )}
              </dd>
            </div>

            <div>
              <dt>City</dt>
              <dd>
                {getValue(
                  facility,
                  "city",
                )}
              </dd>
            </div>

            <div>
              <dt>State / Province</dt>
              <dd>
                {getValue(
                  facility,
                  "state",
                  "state_name",
                )}
              </dd>
            </div>

            <div>
              <dt>Country</dt>
              <dd>
                {getValue(
                  facility,
                  "country",
                  "country_name",
                )}
              </dd>
            </div>
          </dl>
        </article>

        <article className="detail-card">
          <div className="detail-card__header">
            <div>
              <h2>Contact</h2>
              <p>
                Facility contact information.
              </p>
            </div>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Phone</dt>
              <dd>
                {getValue(
                  facility,
                  "phone",
                  "telephone",
                )}
              </dd>
            </div>

            <div>
              <dt>Email</dt>
              <dd>
                {getValue(
                  facility,
                  "email",
                )}
              </dd>
            </div>
          </dl>
        </article>

        <article className="detail-card">
          <div className="detail-card__header">
            <div>
              <h2>Record information</h2>
              <p>
                System identifiers and timestamps.
              </p>
            </div>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Facility ID</dt>
              <dd>
                {getValue(
                  facility,
                  "id",
                )}
              </dd>
            </div>

            <div>
              <dt>Created</dt>
              <dd>
                {getValue(
                  facility,
                  "created_at",
                  "createdAt",
                )}
              </dd>
            </div>

            <div>
              <dt>Last updated</dt>
              <dd>
                {getValue(
                  facility,
                  "updated_at",
                  "updatedAt",
                )}
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}