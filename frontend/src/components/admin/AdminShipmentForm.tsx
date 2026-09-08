import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import Textarea from "../common/Textarea";

import {
  createShipment,
  updateShipment,
} from "../../lib/api";

import type {
  CreateShipmentInput,
  Shipment,
  UpdateShipmentInput,
} from "../../types";

interface AdminShipmentFormProps {
  shipment?: Shipment | null;
  onSaved?: (
    shipment?: Shipment,
  ) => void;
  onCancel?: () => void;
  className?: string;
}

type FormState = {
  tracking_number: string;
  sender_name: string;
  receiver_name: string;
  origin: string;
  destination: string;
  current_location: string;
  status: string;
  service_type: string;
  package_description: string;
  weight: string;
  estimated_delivery: string;
};

const STATUS_OPTIONS = [
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

const SERVICE_OPTIONS = [
  {
    value: "standard",
    label: "Standard",
  },
  {
    value: "express",
    label: "Express",
  },
  {
    value: "priority",
    label: "Priority",
  },
  {
    value: "overnight",
    label: "Overnight",
  },
];

function createInitialState(
  shipment?: Shipment | null,
): FormState {
  return {
    tracking_number:
      shipment?.tracking_number || "",
    sender_name:
      shipment?.sender_name || "",
    receiver_name:
      shipment?.receiver_name || "",
    origin:
      shipment?.origin || "",
    destination:
      shipment?.destination || "",
    current_location:
      shipment?.current_location || "",
    status:
      shipment?.status || "pending",
    service_type:
      shipment?.service_type || "standard",
    package_description:
      shipment?.package_description || "",
    weight:
      shipment?.weight !== undefined &&
      shipment?.weight !== null
        ? String(shipment.weight)
        : "",
    estimated_delivery:
      shipment?.estimated_delivery
        ? formatDateTimeLocal(
            shipment.estimated_delivery,
          )
        : "",
  };
}

function formatDateTimeLocal(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  const hours = String(
    date.getHours(),
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getIsoDate(
  value: string,
): string | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
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

  return "The shipment could not be saved.";
}

function extractShipment(
  response: unknown,
): Shipment | undefined {
  if (
    !response ||
    typeof response !== "object"
  ) {
    return undefined;
  }

  const root =
    response as Record<
      string,
      unknown
    >;

  if (
    root.shipment &&
    typeof root.shipment === "object" &&
    !Array.isArray(root.shipment)
  ) {
    return root.shipment as Shipment;
  }

  if (
    root.data &&
    typeof root.data === "object" &&
    !Array.isArray(root.data)
  ) {
    const data =
      root.data as Record<
        string,
        unknown
      >;

    if (
      data.shipment &&
      typeof data.shipment === "object" &&
      !Array.isArray(data.shipment)
    ) {
      return data.shipment as Shipment;
    }

    if (
      data.id ||
      data.tracking_number
    ) {
      return data as unknown as Shipment;
    }
  }

  if (
    root.id ||
    root.tracking_number
  ) {
    return root as unknown as Shipment;
  }

  return undefined;
}

export default function AdminShipmentForm({
  shipment = null,
  onSaved,
  onCancel,
  className = "",
}: AdminShipmentFormProps) {
  const editing = Boolean(
    shipment?.id,
  );

  const [form, setForm] =
    useState<FormState>(
      () =>
        createInitialState(
          shipment,
        ),
    );

  const [errors, setErrors] =
    useState<
      Partial<
        Record<
          keyof FormState,
          string
        >
      >
    >({});

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const title = useMemo(
    () =>
      editing
        ? "Edit shipment"
        : "Create shipment",
    [editing],
  );

  useEffect(() => {
    setForm(
      createInitialState(
        shipment,
      ),
    );

    setErrors({});
    setError("");
  }, [shipment]);

  const updateField =
    useCallback(
      (
        field: keyof FormState,
        value: string,
      ) => {
        setForm((current) => ({
          ...current,
          [field]: value,
        }));

        setErrors((current) => ({
          ...current,
          [field]: "",
        }));

        setError("");
      },
      [],
    );

  const validate =
    useCallback(() => {
      const nextErrors: Partial<
        Record<
          keyof FormState,
          string
        >
      > = {};

      if (
        !form.sender_name.trim()
      ) {
        nextErrors.sender_name =
          "Sender name is required.";
      }

      if (
        !form.receiver_name.trim()
      ) {
        nextErrors.receiver_name =
          "Receiver name is required.";
      }

      if (!form.origin.trim()) {
        nextErrors.origin =
          "Origin is required.";
      }

      if (
        !form.destination.trim()
      ) {
        nextErrors.destination =
          "Destination is required.";
      }

      if (!form.service_type.trim()) {
        nextErrors.service_type =
          "Service type is required.";
      }

      if (
        form.weight.trim() &&
        (
          Number.isNaN(
            Number(form.weight),
          ) ||
          Number(form.weight) < 0
        )
      ) {
        nextErrors.weight =
          "Weight must be a valid non-negative number.";
      }

      if (
        form.estimated_delivery &&
        !getIsoDate(
          form.estimated_delivery,
        )
      ) {
        nextErrors.estimated_delivery =
          "Enter a valid delivery date and time.";
      }

      setErrors(nextErrors);

      return (
        Object.keys(nextErrors)
          .length === 0
      );
    }, [form]);

  const handleSubmit =
    useCallback(
      async (
        event: FormEvent<HTMLFormElement>,
      ) => {
        event.preventDefault();

        if (!validate()) {
          return;
        }

        setSaving(true);
        setError("");

        try {
          const weight =
            form.weight.trim()
              ? Number(
                  form.weight,
                )
              : undefined;

          const estimatedDelivery =
            getIsoDate(
              form.estimated_delivery,
            );

          if (editing && shipment?.id) {
            const payload: UpdateShipmentInput =
              {
                sender_name:
                  form.sender_name.trim(),
                receiver_name:
                  form.receiver_name.trim(),
                origin:
                  form.origin.trim(),
                destination:
                  form.destination.trim(),
                current_location:
                  form.current_location.trim() ||
                  undefined,
                status:
                  form.status,
                service_type:
                  form.service_type,
                package_description:
                  form.package_description.trim() ||
                  undefined,
                weight,
                estimated_delivery:
                  estimatedDelivery,
              };

            const response =
              await updateShipment(
                shipment.id,
                payload,
              );

            const saved =
              extractShipment(
                response,
              );

            onSaved?.(saved);
          } else {
            const payload: CreateShipmentInput =
              {
                tracking_number:
                  form.tracking_number.trim() ||
                  undefined,
                sender_name:
                  form.sender_name.trim(),
                receiver_name:
                  form.receiver_name.trim(),
                origin:
                  form.origin.trim(),
                destination:
                  form.destination.trim(),
                current_location:
                  form.current_location.trim() ||
                  undefined,
                status:
                  form.status,
                service_type:
                  form.service_type,
                package_description:
                  form.package_description.trim() ||
                  undefined,
                weight,
                estimated_delivery:
                  estimatedDelivery,
              };

            const response =
              await createShipment(
                payload,
              );

            const saved =
              extractShipment(
                response,
              );

            onSaved?.(saved);
          }
        } catch (err: unknown) {
          setError(
            getErrorMessage(err),
          );
        } finally {
          setSaving(false);
        }
      },
      [
        editing,
        form,
        onSaved,
        shipment,
        validate,
      ],
    );

  return (
    <section
      className={`admin-shipment-form ${
        className
          ? `admin-shipment-form--${className}`
          : ""
      }`.trim()}
      aria-labelledby="admin-shipment-form-title"
    >
      <div className="dashboard-section__header">
        <div>
          <span className="page-heading__eyebrow">
            Shipment
          </span>

          <h1 id="admin-shipment-form-title">
            {title}
          </h1>

          <p>
            {editing
              ? "Update shipment information and delivery status."
              : "Enter the shipment information to create a new delivery."}
          </p>
        </div>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Unable to save shipment"
          dismissible
          onDismiss={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      <form
        className="form admin-shipment-form__form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="form-section">
          <div className="form-section__header">
            <h2>
              Shipment information
            </h2>

            <p>
              Basic shipment and package
              details.
            </p>
          </div>

          <div className="form-grid">
            <Input
              label="Tracking number"
              value={
                form.tracking_number
              }
              onChange={(event) =>
                updateField(
                  "tracking_number",
                  event.target.value,
                )
              }
              placeholder="Auto-generated if left blank"
              hint={
                editing
                  ? "Tracking numbers should normally remain unchanged."
                  : "Leave blank to let the backend generate one."
              }
              readOnly={editing}
            />

            <Select
              label="Service type"
              value={
                form.service_type
              }
              onChange={(event) =>
                updateField(
                  "service_type",
                  event.target.value,
                )
              }
              options={
                SERVICE_OPTIONS
              }
              error={
                errors.service_type
              }
              required
            />

            <Select
              label="Status"
              value={form.status}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value,
                )
              }
              options={
                STATUS_OPTIONS
              }
              required
            />

            <Input
              label="Weight"
              type="number"
              min="0"
              step="any"
              value={form.weight}
              onChange={(event) =>
                updateField(
                  "weight",
                  event.target.value,
                )
              }
              error={errors.weight}
              placeholder="e.g. 2.5"
              hint="Use the unit configured by your shipment system."
            />

            <Input
              label="Estimated delivery"
              type="datetime-local"
              value={
                form.estimated_delivery
              }
              onChange={(event) =>
                updateField(
                  "estimated_delivery",
                  event.target.value,
                )
              }
              error={
                errors.estimated_delivery
              }
            />
          </div>

          <Textarea
            label="Package description"
            value={
              form.package_description
            }
            onChange={(event) =>
              updateField(
                "package_description",
                event.target.value,
              )
            }
            placeholder="Describe the package contents"
            rows={4}
          />
        </div>

        <div className="form-section">
          <div className="form-section__header">
            <h2>
              Delivery route
            </h2>

            <p>
              Enter the shipment origin,
              destination, and current
              location.
            </p>
          </div>

          <div className="form-grid">
            <Input
              label="Sender name"
              value={form.sender_name}
              onChange={(event) =>
                updateField(
                  "sender_name",
                  event.target.value,
                )
              }
              error={
                errors.sender_name
              }
              required
            />

            <Input
              label="Receiver name"
              value={
                form.receiver_name
              }
              onChange={(event) =>
                updateField(
                  "receiver_name",
                  event.target.value,
                )
              }
              error={
                errors.receiver_name
              }
              required
            />

            <Input
              label="Origin"
              value={form.origin}
              onChange={(event) =>
                updateField(
                  "origin",
                  event.target.value,
                )
              }
              error={errors.origin}
              required
            />

            <Input
              label="Destination"
              value={
                form.destination
              }
              onChange={(event) =>
                updateField(
                  "destination",
                  event.target.value,
                )
              }
              error={
                errors.destination
              }
              required
            />

            <Input
              label="Current location"
              value={
                form.current_location
              }
              onChange={(event) =>
                updateField(
                  "current_location",
                  event.target.value,
                )
              }
              hint="Leave blank if the current location is not yet known."
            />
          </div>
        </div>

        <div className="form-actions">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={saving}
          >
            {editing
              ? "Save changes"
              : "Create shipment"}
          </Button>
        </div>
      </form>
    </section>
  );
}