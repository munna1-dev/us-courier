import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";

import {
  apiPost,
  apiPut,
} from "../../lib/api";

import type { Courier } from "../../types";

interface AdminCourierFormProps {
  courier?: Courier;
  onSaved?: (courier?: Courier) => void;
  onCancel?: () => void;
  className?: string;
}

interface CourierFormState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: string;
}

function getIdentifier(
  courier?: Courier,
): string {
  if (!courier) {
    return "";
  }

  return (
    String(courier.id || "").trim() ||
    String(courier.user_id || "").trim()
  );
}

function getInitialState(
  courier?: Courier,
): CourierFormState {
  return {
    first_name:
      courier?.first_name || "",
    last_name:
      courier?.last_name || "",
    email:
      courier?.email || "",
    phone:
      courier?.phone || "",
    is_active:
      courier?.is_active === false
        ? "false"
        : "true",
  };
}

function extractCourier(
  response: unknown,
): Courier | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const source =
    response as {
      courier?: Courier;
      data?: Courier | {
        courier?: Courier;
      };
    };

  if (source.courier) {
    return source.courier;
  }

  if (
    source.data &&
    typeof source.data === "object" &&
    "id" in source.data
  ) {
    return source.data as Courier;
  }

  if (
    source.data &&
    typeof source.data === "object" &&
    "courier" in source.data
  ) {
    return source.data.courier;
  }

  return undefined;
}

export default function AdminCourierForm({
  courier,
  onSaved,
  onCancel,
  className = "",
}: AdminCourierFormProps) {
  const editing = Boolean(courier);
  const identifier = getIdentifier(courier);

  const [form, setForm] =
    useState<CourierFormState>(
      () => getInitialState(courier),
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    setForm(getInitialState(courier));
    setError("");
    setSuccess("");
  }, [courier]);

  const updateField = useCallback(
    (
      field: keyof CourierFormState,
      value: string,
    ) => {
      setForm((current) => ({
        ...current,
        [field]: value,
      }));

      if (error) {
        setError("");
      }

      if (success) {
        setSuccess("");
      }
    },
    [error, success],
  );

  const validate = useCallback(() => {
    if (!form.first_name.trim()) {
      return "First name is required.";
    }

    if (!form.last_name.trim()) {
      return "Last name is required.";
    }

    if (!form.email.trim()) {
      return "Email address is required.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      return "Enter a valid email address.";
    }

    return "";
  }, [form]);

  const handleSubmit = useCallback(
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      const validationError =
        validate();

      if (validationError) {
        setError(validationError);
        return;
      }

      if (
        editing &&
        !identifier
      ) {
        setError(
          "This courier does not have a valid identifier.",
        );
        return;
      }

      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        first_name:
          form.first_name.trim(),
        last_name:
          form.last_name.trim(),
        email:
          form.email.trim(),
        phone:
          form.phone.trim() || null,
        is_active:
          form.is_active === "true",
      };

      try {
        const response = editing
          ? await apiPut(
              `/api/couriers/${encodeURIComponent(
                identifier,
              )}`,
              payload,
            )
          : await apiPost(
              "/api/couriers",
              payload,
            );

        const saved =
          extractCourier(response);

        setSuccess(
          editing
            ? "Courier updated successfully."
            : "Courier created successfully.",
        );

        if (saved) {
          setForm(
            getInitialState(saved),
          );
        }

        onSaved?.(saved);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : editing
              ? "Unable to update the courier."
              : "Unable to create the courier.",
        );
      } finally {
        setSaving(false);
      }
    },
    [
      editing,
      form,
      identifier,
      onSaved,
      validate,
    ],
  );

  return (
    <section
      className={`admin-courier-form ${
        className
          ? `admin-courier-form--${className}`
          : ""
      }`.trim()}
      aria-labelledby="admin-courier-form-title"
    >
      <div className="page-heading">
        <div>
          <h1 id="admin-courier-form-title">
            {editing
              ? "Edit Courier"
              : "Add Courier"}
          </h1>

          <p>
            {editing
              ? "Update the courier account information."
              : "Create a courier account for Dispatch Courier."}
          </p>
        </div>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Unable to save courier"
          dismissible
          onDismiss={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          title="Courier saved"
          dismissible
          onDismiss={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      <form
        className="card admin-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="form-grid">
          <Input
            label="First name"
            value={form.first_name}
            onChange={(event) =>
              updateField(
                "first_name",
                event.target.value,
              )
            }
            required
            disabled={saving}
            autoComplete="given-name"
          />

          <Input
            label="Last name"
            value={form.last_name}
            onChange={(event) =>
              updateField(
                "last_name",
                event.target.value,
              )
            }
            required
            disabled={saving}
            autoComplete="family-name"
          />

          <Input
            label="Email address"
            type="email"
            value={form.email}
            onChange={(event) =>
              updateField(
                "email",
                event.target.value,
              )
            }
            required
            disabled={saving}
            autoComplete="email"
          />

          <Input
            label="Phone number"
            type="tel"
            value={form.phone}
            onChange={(event) =>
              updateField(
                "phone",
                event.target.value,
              )
            }
            disabled={saving}
            autoComplete="tel"
          />

          <Select
            label="Account status"
            value={form.is_active}
            onChange={(event) =>
              updateField(
                "is_active",
                event.target.value,
              )
            }
            disabled={saving}
            options={[
              {
                value: "true",
                label: "Active",
              },
              {
                value: "false",
                label: "Inactive",
              },
            ]}
          />
        </div>

        {editing && identifier && (
          <div className="form-readonly">
            <span>Courier ID</span>
            <strong>
              {identifier}
            </strong>
          </div>
        )}

        <div className="button-row">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={saving}
          >
            {editing
              ? "Save changes"
              : "Create courier"}
          </Button>
        </div>
      </form>
    </section>
  );
}