import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import Input from "../common/Input";

import {
  apiPut,
} from "../../lib/api";

import type { User } from "../../types";

interface ProfileFormProps {
  user: User;
  onSaved?: (user?: User) => void;
  onCancel?: () => void;
  className?: string;
}

interface ProfileFormState {
  first_name: string;
  last_name: string;
  phone: string;
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
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Unable to update your profile. Please try again.";
}

function extractUser(
  response: unknown,
): User | undefined {
  if (
    !response ||
    typeof response !== "object"
  ) {
    return undefined;
  }

  const value =
    response as Record<string, unknown>;

  if (
    value.user &&
    typeof value.user === "object"
  ) {
    return value.user as unknown as User;
  }

  if (
    value.data &&
    typeof value.data === "object" &&
    !Array.isArray(value.data)
  ) {
    const data =
      value.data as Record<string, unknown>;

    if (
      data.user &&
      typeof data.user === "object"
    ) {
      return data.user as unknown as User;
    }

    if (
      "id" in data ||
      "email" in data
    ) {
      return data as unknown as User;
    }
  }

  if (
    "id" in value ||
    "email" in value
  ) {
    return value as unknown as User;
  }

  return undefined;
}

export default function ProfileForm({
  user,
  onSaved,
  onCancel,
  className = "",
}: ProfileFormProps) {
  const [form, setForm] =
    useState<ProfileFormState>({
      first_name:
        user.first_name || "",
      last_name:
        user.last_name || "",
      phone:
        user.phone || "",
    });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    setForm({
      first_name:
        user.first_name || "",
      last_name:
        user.last_name || "",
      phone:
        user.phone || "",
    });

    setError("");
    setSuccess("");
  }, [
    user.id,
    user.first_name,
    user.last_name,
    user.phone,
  ]);

  const handleChange =
    useCallback(
      (
        field: keyof ProfileFormState,
        value: string,
      ) => {
        setForm((current) => ({
          ...current,
          [field]: value,
        }));

        setError("");
        setSuccess("");
      },
      [],
    );

  const handleSubmit =
    useCallback(
      async (
        event: FormEvent<HTMLFormElement>,
      ) => {
        event.preventDefault();

        if (!user.id) {
          setError(
            "Your account identifier is missing.",
          );
          return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
          const response =
            await apiPut(
              `/api/users/${encodeURIComponent(
                user.id,
              )}`,
              {
                first_name:
                  form.first_name.trim(),
                last_name:
                  form.last_name.trim(),
                phone:
                  form.phone.trim(),
              },
            );

          const updatedUser =
            extractUser(response);

          setSuccess(
            "Your profile has been updated successfully.",
          );

          if (updatedUser) {
            onSaved?.(updatedUser);
          } else {
            onSaved?.();
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
        form.first_name,
        form.last_name,
        form.phone,
        onSaved,
        user.id,
      ],
    );

  return (
    <form
      className={`profile-form ${
        className
          ? `profile-form--${className}`
          : ""
      }`.trim()}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="profile-form__header">
        <div>
          <h2>Edit profile</h2>
          <p>
            Update the information associated
            with your account.
          </p>
        </div>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Unable to save profile"
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          title="Profile saved"
        >
          {success}
        </Alert>
      )}

      <div className="profile-form__fields">
        <Input
          label="First name"
          value={form.first_name}
          onChange={(event) =>
            handleChange(
              "first_name",
              event.target.value,
            )
          }
          autoComplete="given-name"
          required
        />

        <Input
          label="Last name"
          value={form.last_name}
          onChange={(event) =>
            handleChange(
              "last_name",
              event.target.value,
            )
          }
          autoComplete="family-name"
          required
        />

        <Input
          label="Email"
          value={user.email || ""}
          disabled
          readOnly
          autoComplete="email"
          hint="Your email address cannot be changed here."
        />

        <Input
          label="Phone"
          value={form.phone}
          onChange={(event) =>
            handleChange(
              "phone",
              event.target.value,
            )
          }
          autoComplete="tel"
          type="tel"
        />
      </div>

      <div className="profile-form__actions">
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
          disabled={saving}
        >
          Save changes
        </Button>
      </div>
    </form>
  );
}