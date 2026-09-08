import { useCallback, useEffect, useState } from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import LoadingScreen from "../common/LoadingScreen";
import AdminShipmentDetails from "./AdminShipmentDetails";
import AdminShipmentForm from "./AdminShipmentForm";

import {
  getShipment,
} from "../../lib/api";

import type { Shipment } from "../../types";

type ShipmentPageMode = "details" | "new" | "edit";

interface AdminShipmentPageProps {
  shipmentId?: string;
  mode?: ShipmentPageMode;
  className?: string;
}

interface ShipmentResponse {
  shipment?: Shipment;
  data?: Shipment | { shipment?: Shipment };
}

function extractShipment(response: unknown): Shipment | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const source = response as ShipmentResponse;

  if (source.shipment) {
    return source.shipment;
  }

  if (!source.data) {
    return null;
  }

  if (
    typeof source.data === "object" &&
    "shipment" in source.data &&
    source.data.shipment
  ) {
    return source.data.shipment;
  }

  if (
    typeof source.data === "object" &&
    "tracking_number" in source.data
  ) {
    return source.data as Shipment;
  }

  return null;
}

function normalizePath(path: string): string {
  const normalized = path.replace(/\/+$/, "");
  return normalized || "/";
}

function navigate(
  path: string,
  replace = false,
): void {
  const nextPath = normalizePath(path);
  const currentPath = normalizePath(window.location.pathname);

  if (currentPath === nextPath) {
    return;
  }

  if (replace) {
    window.history.replaceState({}, "", nextPath);
  } else {
    window.history.pushState({}, "", nextPath);
  }

  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function AdminShipmentPage({
  shipmentId,
  mode = "details",
  className = "",
}: AdminShipmentPageProps) {
  const [shipment, setShipment] =
    useState<Shipment | null>(null);

  const [loading, setLoading] =
    useState(mode !== "new");

  const [error, setError] =
    useState("");

  const loadShipment = useCallback(async () => {
    if (mode === "new") {
      setShipment(null);
      setLoading(false);
      setError("");
      return;
    }

    const identifier = shipmentId?.trim();

    if (!identifier) {
      setShipment(null);
      setLoading(false);
      setError("No shipment identifier was provided.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getShipment(identifier);
      const result = extractShipment(response);

      if (!result) {
        throw new Error(
          "Shipment information is unavailable.",
        );
      }

      setShipment(result);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the shipment.";

      setShipment(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [mode, shipmentId]);

  useEffect(() => {
    void loadShipment();
  }, [loadShipment]);

  useEffect(() => {
    const titles: Record<ShipmentPageMode, string> = {
      details: "Shipment Details — Dispatch Courier",
      new: "Create Shipment — Dispatch Courier",
      edit: "Edit Shipment — Dispatch Courier",
    };

    document.title =
      mode === "edit" && shipment?.tracking_number
        ? `Edit ${shipment.tracking_number} — Dispatch Courier`
        : titles[mode];
  }, [mode, shipment]);

  const handleBack = useCallback(() => {
    navigate("/admin/shipments");
  }, []);

  const handleSaved = useCallback(
    (savedShipment?: Shipment) => {
      const savedIdentifier =
        savedShipment?.id ||
        savedShipment?.tracking_number ||
        shipment?.id ||
        shipment?.tracking_number;

      if (savedIdentifier) {
        navigate(
          `/admin/shipments/${encodeURIComponent(
            savedIdentifier,
          )}`,
          true,
        );
        return;
      }

      navigate("/admin/shipments", true);
    },
    [shipment],
  );

  const handleEdit = useCallback(() => {
    const identifier =
      shipment?.id || shipment?.tracking_number;

    if (!identifier) {
      setError(
        "This shipment cannot be edited because it has no identifier.",
      );
      return;
    }

    navigate(
      `/admin/shipments/${encodeURIComponent(
        identifier,
      )}/edit`,
    );
  }, [shipment]);

  const handleRetry = useCallback(() => {
    void loadShipment();
  }, [loadShipment]);

  const handleCancelForm = useCallback(() => {
    if (shipment) {
      navigate(
        `/admin/shipments/${encodeURIComponent(
          shipment.id || shipment.tracking_number,
        )}`,
      );
      return;
    }

    navigate("/admin/shipments");
  }, [shipment]);

  if (mode === "new") {
    return (
      <div
        className={`admin-shipment-page ${
          className
            ? `admin-shipment-page--${className}`
            : ""
        }`.trim()}
      >
        <div className="page-heading">
          <h1>Create Shipment</h1>
          <p>
            Create a new shipment and add its delivery
            information.
          </p>
        </div>

        <AdminShipmentForm
          onSaved={handleSaved}
          onCancel={handleCancelForm}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`admin-shipment-page ${
          className
            ? `admin-shipment-page--${className}`
            : ""
        }`.trim()}
      >
        <LoadingScreen
          message="Loading shipment..."
          fullScreen={false}
        />
      </div>
    );
  }

  if (error && !shipment) {
    return (
      <div
        className={`admin-shipment-page ${
          className
            ? `admin-shipment-page--${className}`
            : ""
        }`.trim()}
      >
        <div className="page-heading">
          <h1>
            {mode === "edit"
              ? "Edit Shipment"
              : "Shipment Details"}
          </h1>
          <p>
            We couldn't load the requested shipment.
          </p>
        </div>

        <Alert
          variant="error"
          title="Shipment unavailable"
        >
          {error}
        </Alert>

        <div className="button-row">
          <Button
            type="button"
            variant="secondary"
            onClick={handleRetry}
          >
            Try again
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
          >
            Back to shipments
          </Button>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div
        className={`admin-shipment-page ${
          className
            ? `admin-shipment-page--${className}`
            : ""
        }`.trim()}
      >
        <Alert
          variant="warning"
          title="Shipment not found"
        >
          The requested shipment could not be found.
        </Alert>

        <div className="button-row">
          <Button
            type="button"
            variant="secondary"
            onClick={handleBack}
          >
            Back to shipments
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div
        className={`admin-shipment-page ${
          className
            ? `admin-shipment-page--${className}`
            : ""
        }`.trim()}
      >
        <div className="page-heading">
          <h1>Edit Shipment</h1>
          <p>
            Update the shipment information below.
          </p>
        </div>

        {error && (
          <Alert
            variant="error"
            title="Update warning"
          >
            {error}
          </Alert>
        )}

        <AdminShipmentForm
          shipment={shipment}
          onSaved={handleSaved}
          onCancel={handleCancelForm}
        />
      </div>
    );
  }

  return (
    <div
      className={`admin-shipment-page ${
        className
          ? `admin-shipment-page--${className}`
          : ""
      }`.trim()}
    >
      <AdminShipmentDetails
        shipmentId={
          shipment.id || shipment.tracking_number
        }
        onBack={handleBack}
        onEdit={handleEdit}
      />
    </div>
  );
}