import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import LoadingScreen from "../components/common/LoadingScreen";

import AdminShipmentDetails from "../components/admin/AdminShipmentDetails";
import AdminShipmentManagement from "../components/admin/AdminShipmentmanagement";

import {
  getShipment,
} from "../lib/api";

import type {
  Shipment,
} from "../types";

interface AdminShipmentPageProps {
  initialShipmentId?: string;
  className?: string;
}

type ShipmentView =
  | "list"
  | "details";

function getShipmentId(
  shipment: Shipment
): string {
  return (
    shipment.id ||
    shipment.tracking_number ||
    shipment.trackingNumber ||
    ""
  );
}

export default function AdminShipmentPage({
  initialShipmentId,
  className = "",
}: AdminShipmentPageProps) {
  const [
    view,
    setView,
  ] = useState<ShipmentView>(
    initialShipmentId
      ? "details"
      : "list"
  );

  const [
    selectedShipment,
    setSelectedShipment,
  ] = useState<Shipment | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(
    Boolean(initialShipmentId)
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const loadShipment =
    useCallback(
      async (shipmentId: string) => {
        if (!shipmentId) {
          setSelectedShipment(null);
          setView("list");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        try {
          const shipment =
            await getShipment(
              shipmentId
            );

          if (!shipment) {
            setSelectedShipment(null);

            setError(
              "Shipment could not be found."
            );

            setView("list");
            return;
          }

          setSelectedShipment(
            shipment
          );

          setView("details");
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load shipment."
          );

          setSelectedShipment(
            null
          );

          setView("list");
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    if (initialShipmentId) {
      void loadShipment(
        initialShipmentId
      );
    }
  }, [
    initialShipmentId,
    loadShipment,
  ]);

  const handleShipmentSelect =
    useCallback(
      (shipmentId: string) => {
        if (!shipmentId) {
          setError(
            "This shipment does not have a valid identifier."
          );
          return;
        }

        setError("");
        setMessage("");

        window.history.pushState(
          {},
          "",
          `/admin/shipments/${encodeURIComponent(
            shipmentId
          )}`
        );

        void loadShipment(
          shipmentId
        );
      },
      [loadShipment]
    );

  const handleBack =
    useCallback(() => {
      setSelectedShipment(null);
      setView("list");
      setError("");
      setMessage("");

      window.history.pushState(
        {},
        "",
        "/admin/shipments"
      );
    }, []);

  const handleSaved =
    useCallback(
      (shipment: Shipment) => {
        setSelectedShipment(
          shipment
        );

        setMessage(
          "Shipment updated successfully."
        );
      },
      []
    );

  const handleEdit =
    useCallback(
      (shipment: Shipment) => {
        setSelectedShipment(
          shipment
        );

        setMessage(
          "Shipment editing is ready."
        );
      },
      []
    );

  useEffect(() => {
    const handlePopState =
      () => {
        const pathname =
          window.location.pathname;

        const match =
          pathname.match(
            /^\/admin\/shipments\/([^/]+)\/?$/
          );

        if (!match) {
          setSelectedShipment(
            null
          );

          setView("list");
          setError("");
          setMessage("");

          return;
        }

        let shipmentId =
          match[1];

        try {
          shipmentId =
            decodeURIComponent(
              shipmentId
            );
        } catch {
          // Keep the original value.
        }

        void loadShipment(
          shipmentId
        );
      };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, [loadShipment]);

  const containerClassName = [
    "admin-shipment-page",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <section
        className={containerClassName}
      >
        <LoadingScreen />
      </section>
    );
  }

  if (view === "details") {
    const shipmentId =
      selectedShipment
        ? getShipmentId(
            selectedShipment
          )
        : "";

    if (!shipmentId) {
      return (
        <section
          className={containerClassName}
        >
          <Alert
            variant="error"
            title="Shipment error"
          >
            The selected shipment
            does not have a valid
            identifier.
          </Alert>

          <div className="admin-shipment-page__toolbar">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
            >
              ← Back to shipments
            </Button>
          </div>
        </section>
      );
    }

    return (
      <section
        className={containerClassName}
      >
        {error && (
          <Alert
            variant="error"
            title="Shipment error"
          >
            {error}
          </Alert>
        )}

        {message && (
          <Alert
            variant="success"
            title="Shipment management"
          >
            {message}
          </Alert>
        )}

        <div className="admin-shipment-page__toolbar">
          <Button
            type="button"
            variant="secondary"
            onClick={handleBack}
          >
            ← Back to shipments
          </Button>
        </div>

        <AdminShipmentDetails
          shipmentId={shipmentId}
          onBack={handleBack}
          onEdit={handleEdit}
        />
      </section>
    );
  }

  return (
    <section
      className={containerClassName}
    >
      {error && (
        <Alert
          variant="error"
          title="Shipment error"
        >
          {error}
        </Alert>
      )}

      {message && (
        <Alert
          variant="success"
          title="Shipment management"
        >
          {message}
        </Alert>
      )}

      <div className="admin-shipment-page__toolbar">
        <div>
          <p className="admin-shipment-page__eyebrow">
            Administration
          </p>

          <h2 className="admin-shipment-page__title">
            Shipment management
          </h2>

          <p className="admin-shipment-page__description">
            Search shipments, review
            tracking information, and
            manage delivery operations.
          </p>
        </div>
      </div>

      <AdminShipmentManagement
        onSelectShipment={
          handleShipmentSelect
        }
      />
    </section>
  );
}