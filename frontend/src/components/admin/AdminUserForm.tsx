import {
  FormEvent,
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

import type {
  User,
  UserRole,
} from "../../types";

interface AdminUserFormProps {
  user?: User;
  onSaved?: (user?: User) => void;
  onCancel?: () => void;
  className?: string;
}

interface UserFormState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
}

const ROLE_OPTIONS = [
  {
    value: "customer",
    label: "Customer",
  },
  {
    value: "admin",
    label: "Administrator",
  },
  {
    value: "manager",
    label: "Manager",
  },
  {
    value: "cashier",
    label: "Cashier",
  },
  {
    value: "courier",
    label: "Courier",
  },
];

function getInitialState(
  user?: User,
): UserFormState {
  const role =
    Array.isArray(user?.roles) &&
    user.roles.length
      ? user.roles[0]
      : user?.role || "customer";

  return {
    first_name:
      user?.first_name || "",
    last_name:
      user?.last_name || "",
    email:
      user?.email || "",
    phone:
      user?.phone || "",
    role,
    is_active:
      user?.is_active !== false,
  };
}

function extractUser(
  response: unknown,
): User | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const source = response as {
    user?: User;
    data?: User | {
      user?: User;
      data?: User;
    };
  };

  if (source.user) {
    return source.user;
  }

  if (!source.data) {
    return undefined;
  }

  if (
    typeof source.data === "object" &&
    "user" in source.data &&
    source.data.user
  ) {
    return source.data.user;
  }

  if (
    typeof source.data === "object" &&
    "email" in source.data
  ) {
    return source.data as User;
  }

  return undefined;
}

function getIdentifier(
  user?: User,
): string {
  return (
    String(user?.id || "").trim() ||
    String(user?.email || "").trim()
  );
}

export default function AdminUserForm({
  user,
  onSaved,
  onCancel,
  className = "",
}: AdminUserFormProps) {
  const isEditing = Boolean(user);

  const [form, setForm] =
    useState<UserFormState>(
      () => getInitialState(user),
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    setForm(getInitialState(user));
    setError("");
    setSuccess("");
  }, [user]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const firstName =
      form.first_name.trim();

    const lastName =
      form.last_name.trim();

    const email =
      form.email.trim();

    const phone =
      form.phone.trim();

    const role =
      form.role.trim();

    if (!firstName) {
      setError(
        "First name is required.",
      );
      return;
    }

    if (!lastName) {
      setError(
        "Last name is required.",
      );
      return;
    }

    if (!email) {
      setError(
        "Email address is required.",
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      setError(
        "Enter a valid email address.",
      );
      return;
    }

    if (!role) {
      setError(
        "Select a user role.",
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || undefined,
        role: role as UserRole,
        is_active: form.is_active,
      };

      let response: unknown;

      if (isEditing) {
        const identifier =
          getIdentifier(user);

        if (!identifier) {
          throw new Error(
            "The user does not have a valid identifier.",
          );
        }

        response = await apiPut(
          `/api/users/${encodeURIComponent(
            identifier,
          )}`,
          payload,
        );
      } else {
        response = await apiPost(
          "/api/users",
          payload,
        );
      }

      const savedUser =
        extractUser(response);

      setSuccess(
        isEditing
          ? "User updated successfully."
          : "User created successfully.",
      );

      if (savedUser) {
        setForm(
          getInitialState(savedUser),
        );
      }

      onSaved?.(savedUser);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : isEditing
            ? "Unable to update the user."
            : "Unable to create the user.",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = <
    K extends keyof UserFormState,
  >(
    field: K,
    value: UserFormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <form
      className={`admin-user-form ${
        className
          ? `admin-user-form--${className}`
          : ""
      }`.trim()}
      onSubmit={handleSubmit}
      noValidate
    >
      {error && (
        <Alert
          variant="error"
          title={
            isEditing
              ? "Unable to update user"
              : "Unable to create user"
          }
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

      <div className="form-section">
        <div className="form-section__header">
          <h2>Personal information</h2>
          <p>
            Enter the user's basic account
            information.
          </p>
        </div>

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
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="form-section">
        <div className="form-section__header">
          <h2>Access and status</h2>
          <p>
            Configure the user's role and
            account status.
          </p>
        </div>

        <div className="form-grid">
          <Select
            label="Role"
            value={form.role}
            onChange={(event) =>
              updateField(
                "role",
                event.target.value,
              )
            }
            options={ROLE_OPTIONS}
            required
          />

          <div className="form-field">
            <span className="form-field__label">
              Account status
            </span>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  updateField(
                    "is_active",
                    event.target.checked,
                  )
                }
              />

              <span>
                Active account
              </span>
            </label>

            <small className="form-field__hint">
              Inactive users should not be
              able to use protected
              account features.
            </small>
          </div>
        </div>
      </div>

      <div className="button-row">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          {isEditing
            ? "Save changes"
            : "Create user"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() =>
            onCancel?.()
          }
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}