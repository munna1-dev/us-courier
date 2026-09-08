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

import { apiPost, apiPut } from "../../lib/api";
import type { Facility } from "../../types";

interface AdminFacilityFormProps {
  facility?: Facility;
  onSaved?: (facility?: Facility) => void;
  onCancel?: () => void;
  className?: string;
}

interface FacilityFormState {
  name: string;
  code: string;
  type: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  is_active: boolean;
}

function getString(
  value: unknown,
  fallback = "",
): string {
  return value === null || value === undefined
    ? fallback
    : String(value);
}

function getFacilityValue(
  facility: Facility | undefined,
  ...keys: string[]
): string {
  if (!facility) {
    return "";
  }

  const record = facility as unknown as Record<
    string,
    unknown
  >;

  for (const key of keys) {
    if (
      record[key] !== undefined &&
      record[key] !== null
    ) {
      return getString(record[key]);
    }
  }

  return "";
}

function getInitialState(
  facility?: Facility,
): FacilityFormState {
  const activeValue =
    (facility as unknown as Record<string, unknown> | undefined)
      ?.is_active;

  return {
    name: getFacilityValue(
      facility,
      "name",
      "facility_name",
    ),
    code: getFacilityValue(
      facility,
      "code",
      "facility_code",
    ),
    type: getFacilityValue(
      facility,
      "type",
      "facility_type",
    ),
    address: getFacilityValue(
      facility,
      "address",
      "address_line1",
    ),
    city: getFacilityValue(
      facility,
      "city",
    ),
    state: getFacilityValue(
      facility,
      "state",
      "state_name",
    ),
    country: getFacilityValue(
      facility,
      "country",
      "country_name",
    ),
    phone: getFacilityValue(
      facility,
      "phone",
      "telephone",
    ),
    email: getFacilityValue(
      facility,
      "email",
    ),
    is_active:
      typeof activeValue === "boolean"
        ? activeValue
        : true,
  };
}

function extractFacility(
  value: unknown,
): Facility | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const payload = value as Record<
    string,
    unknown
  >;

  if (
    payload.facility &&
    typeof payload.facility === "object"
  ) {
    return payload.facility as Facility;
  }

  if (
    payload.data &&
    typeof payload.data === "object"
  ) {
    const data = payload.data as Record<
      string,
      unknown
    >;

    if (
      data.facility &&
      typeof data.facility === "object"
    ) {
      return data.facility as Facility;
    }

    return data as unknown as Facility;
  }
return payload as unknown as Facility;
}

export default function AdminFacilityForm({
  facility,
  onSaved,
  onCancel,
  className = "",
}: AdminFacilityFormProps) {
  const editing = Boolean(facility);

  const [form, setForm] = useState<FacilityFormState>(
    () => getInitialState(facility),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setForm(getInitialState(facility));
    setError("");
    setSuccess("");
  }, [facility]);

  const updateField = useCallback(
    <K extends keyof FacilityFormState>(
      field: K,
      value: FacilityFormState[K],
    ) => {
      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      const name = form.name.trim();
      const code = form.code.trim();
      const type = form.type.trim();

      if (!name) {
        setError("Facility name is required.");
        return;
      }

      if (!code) {
        setError("Facility code is required.");
        return;
      }

      if (!type) {
        setError("Facility type is required.");
        return;
      }

      if (
        form.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.email.trim(),
        )
      ) {
        setError(
          "Enter a valid facility email address.",
        );
        return;
      }

      const body = {
        name,
        code,
        type,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        is_active: form.is_active,
      };

      setSaving(true);

      try {
        let response: unknown;

        if (editing && facility) {
          const identifier = String(
            facility.id ??
              facility.code ??
              "",
          );

          if (!identifier) {
            throw new Error(
              "This facility does not have a valid identifier.",
            );
          }

          response = await apiPut(
            `/api/facilities/${encodeURIComponent(
              identifier,
            )}`,
            body,
          );

          setSuccess(
            "Facility updated successfully.",
          );
        } else {
          response = await apiPost(
            "/api/facilities",
            body,
          );

          setSuccess(
            "Facility created successfully.",
          );
        }

        const savedFacility =
          extractFacility(response);

        onSaved?.(savedFacility);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : editing
              ? "Unable to update the facility."
              : "Unable to create the facility.",
        );
      } finally {
        setSaving(false);
      }
    },
    [editing, facility, form, onSaved],
  );

  return (
    <section
      className={`admin-facility-form ${className}`.trim()}
    >
      <div className="page-heading">
        <div>
          <h1>
            {editing
              ? "Edit Facility"
              : "Create Facility"}
          </h1>

          <p>
            {editing
              ? "Update the facility information and operational status."
              : "Add a new courier facility to the network."}
          </p>
        </div>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Unable to save facility"
          dismissible
          onDismiss={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          title="Saved"
          dismissible
          onDismiss={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      <form
        className="form-card"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="form-card__section">
          <h2>Facility information</h2>

          <div className="form-grid">
            <Input
              label="Facility name"
              value={form.name}
              required
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value,
                )
              }
              placeholder="Enter facility name"
            />

            <Input
              label="Facility code"
              value={form.code}
              required
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "code",
                  event.target.value.toUpperCase(),
                )
              }
              placeholder="e.g. LAG-HUB-01"
            />

            <Select
              label="Facility type"
              value={form.type}
              required
              disabled={saving}
              options={[
                {
                  value: "hub",
                  label: "Hub",
                },
                {
                  value: "warehouse",
                  label: "Warehouse",
                },
                {
                  value: "depot",
                  label: "Depot",
                },
                {
                  value: "sorting_center",
                  label: "Sorting Center",
                },
                {
                  value: "branch",
                  label: "Branch",
                },
                {
                  value: "office",
                  label: "Office",
                },
              ]}
              placeholder="Select facility type"
              onChange={(event) =>
                updateField(
                  "type",
                  event.target.value,
                )
              }
            />

            <Input
              label="Phone"
              value={form.phone}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "phone",
                  event.target.value,
                )
              }
              placeholder="Facility phone number"
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "email",
                  event.target.value,
                )
              }
              placeholder="facility@example.com"
            />
          </div>
        </div>

        <div className="form-card__section">
          <h2>Location</h2>

          <div className="form-grid">
            <Input
              label="Address"
              value={form.address}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "address",
                  event.target.value,
                )
              }
              placeholder="Street address"
            />

            <Input
              label="City"
              value={form.city}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "city",
                  event.target.value,
                )
              }
              placeholder="City"
            />

            <Input
              label="State / Province"
              value={form.state}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "state",
                  event.target.value,
                )
              }
              placeholder="State or province"
            />

            <Input
              label="Country"
              value={form.country}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "country",
                  event.target.value,
                )
              }
              placeholder="Country"
            />
          </div>
        </div>

        <div className="form-card__section">
          <h2>Operational status</h2>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.is_active}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "is_active",
                  event.target.checked,
                )
              }
            />

            <span>
              <strong>Active facility</strong>
              <small>
                Allow this facility to be used for
                active courier operations.
              </small>
            </span>
          </label>
        </div>

        <div className="form-card__actions">
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
              : "Create facility"}
          </Button>
        </div>
      </form>
    </section>
  );
}