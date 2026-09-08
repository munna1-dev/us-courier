import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import LoadingScreen from "../components/common/LoadingScreen";
import Select from "../components/common/Select";
import StatusBadge from "../components/common/StatusBadge";

import {
  getFacilities,
  getShipments,
} from "../lib/api";

import type {
  Facility,
  Shipment,
  ShipmentStatus,
} from "../types";

interface AdminShipmentsPageProps {
  className?: string;
}

const STATUS_OPTIONS = [
  {
    value: "",
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
    value: "exception",
    label: "Exception",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

function getShipmentTrackingNumber(
  shipment: Shipment
): string {
  return (
    shipment.tracking_number ||
    shipment.trackingNumber ||
    "—"
  );
}

function getShipmentStatus(
  shipment: Shipment
): ShipmentStatus | string {
  return (
    shipment.status ||
    "pending"
  );
}

function getShipmentRecipient(
  shipment: Shipment
): string {
  return (
    shipment.receiver_name ??
    shipment.receiverName ??
    shipment.recipient_name ??
    shipment.recipientName ??
    "—"
  );
}

function getShipmentRoute(
  shipment: Shipment
): string {
  const origin =
    shipment.origin ??
    shipment.originFacilityId ??
    shipment.origin_facility_id ??
    "";

  const destination =
    shipment.destination ??
    shipment.destinationFacilityId ??
    shipment.destination_facility_id ??
    "";

  if (!origin && !destination) {
    return "Route not specified";
  }

  return `${origin || "Origin"} → ${
    destination || "Destination"
  }`;
}

function getFacilityName(
  facility: Facility
): string {
  return (
    facility.name ??
    facility.facility_name ??
    facility.code ??
    facility.facility_code ??
    "Unnamed facility"
  );
}

export default function AdminShipmentsPage({
  className = "",
}: AdminShipmentsPageProps) {
  const [
    shipments,
    setShipments,
  ] = useState<Shipment[]>([]);

  const [
    facilities,
    setFacilities,
  ] = useState<Facility[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    facilityId,
    setFacilityId,
  ] = useState("");

  const [
    selectedShipmentId,
    setSelectedShipmentId,
  ] = useState<string | null>(
    null
  );

  const loadData =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [
          shipmentResult,
          facilityResult,
        ] = await Promise.all([
          getShipments({
            search:
              search.trim() ||
              undefined,
            status:
              status || undefined,
            facilityId:
              facilityId || undefined,
          }),
          getFacilities(),
        ]);

        setShipments(
          Array.isArray(
            shipmentResult
          )
            ? shipmentResult
            : []
        );

        setFacilities(
          Array.isArray(
            facilityResult
          )
            ? facilityResult
            : []
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load shipments."
        );
      } finally {
        setLoading(false);
      }
    }, [
      search,
      status,
      facilityId,
    ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const facilityOptions =
    useMemo(
      () => [
        {
          value: "",
          label: "All facilities",
        },
        ...facilities.map(
          (facility) => ({
            value: facility.id,
            label:
              getFacilityName(
                facility
              ),
          })
        ),
      ],
      [facilities]
    );

  const handleSearchSubmit =
    useCallback(
      (
        event: React.FormEvent
      ) => {
        event.preventDefault();
        void loadData();
      },
      [loadData]
    );

  const handleShipmentSelect =
    useCallback(
      (shipment: Shipment) => {
        const shipmentId =
          shipment.id ||
          shipment.tracking_number ||
          shipment.trackingNumber ||
          "";

        if (!shipmentId) {
          setError(
            "This shipment does not have a valid identifier."
          );
          return;
        }

        setSelectedShipmentId(
          shipmentId
        );

        window.history.pushState(
          {},
          "",
          `/admin/shipments/${encodeURIComponent(
            shipmentId
          )}`
        );
      },
      []
    );

  const handleClearFilters =
    useCallback(() => {
      setSearch("");
      setStatus("");
      setFacilityId("");
    }, []);

  const containerClassName = [
    "admin-shipments-page",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (selectedShipmentId) {
    window.location.href =
      `/admin/shipments/${encodeURIComponent(
        selectedShipmentId
      )}`;
  }

  if (loading) {
    return (
      <section
        className={containerClassName}
      >
        <LoadingScreen />
      </section>
    );
  }

  return (
    <section
      className={containerClassName}
    >
      <div className="admin-shipments-page__header">
        <div>
          <p className="admin-shipments-page__eyebrow">
            Administration
          </p>

          <h2 className="admin-shipments-page__title">
            Shipment management
          </h2>

          <p className="admin-shipments-page__description">
            Search, review, and manage
            courier shipments.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            window.location.assign(
              "/admin"
            )
          }
        >
          ← Admin dashboard
        </Button>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Shipment error"
        >
          {error}
        </Alert>
      )}

      <form
        className="admin-shipments-page__filters"
        onSubmit={
          handleSearchSubmit
        }
      >
        <div className="admin-shipments-page__search">
          <label htmlFor="shipment-search">
            Search shipments
          </label>

          <input
            id="shipment-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Tracking number, recipient, reference..."
          />
        </div>

        <Select
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(event) =>
            setStatus(
              event.target.value
            )
          }
        />

        <Select
          label="Facility"
          value={facilityId}
          options={facilityOptions}
          onChange={(event) =>
            setFacilityId(
              event.target.value
            )
          }
        />

        <div className="admin-shipments-page__filter-actions">
          <Button
            type="submit"
            variant="primary"
          >
            Search
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={
              handleClearFilters
            }
          >
            Clear
          </Button>
        </div>
      </form>

      {shipments.length === 0 ? (
        <EmptyState
          title="No shipments found"
          description="No shipments match the current search and filter criteria."
          action={{
            label: "Clear filters",
            onClick:
              handleClearFilters,
          }}
        />
      ) : (
        <div className="admin-shipments-page__table-wrapper">
          <table className="admin-shipments-page__table">
            <thead>
              <tr>
                <th>
                  Tracking number
                </th>

                <th>
                  Recipient
                </th>

                <th>
                  Route
                </th>

                <th>
                  Status
                </th>

                <th>
                  Created
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {shipments.map(
                (shipment) => {
                  const shipmentId =
                    shipment.id ||
                    shipment.tracking_number ||
                    shipment.trackingNumber ||
                    "";

                  const shipmentStatus =
                    getShipmentStatus(
                      shipment
                    );

                  return (
                    <tr
                      key={
                        shipmentId
                      }
                    >
                      <td>
                        <strong>
                          {getShipmentTrackingNumber(
                            shipment
                          )}
                        </strong>
                      </td>

                      <td>
                        {getShipmentRecipient(
                          shipment
                        )}
                      </td>

                      <td>
                        {getShipmentRoute(
                          shipment
                        )}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            shipmentStatus
                          }
                        />
                      </td>

                      <td>
                        {shipment.created_at ??
                          shipment.createdAt ??
                          "—"}
                      </td>

                      <td>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={
                            !shipmentId
                          }
                          onClick={() =>
                            handleShipmentSelect(
                              shipment
                            )
                          }
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}