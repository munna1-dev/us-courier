import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import LoadingScreen from "../common/LoadingScreen";

import {
  apiGet,
  getUsers,
} from "../../lib/api";

import type { User } from "../../types";

interface AdminUserDetailsProps {
  userId?: string;
  user?: User | null;
  onBack?: () => void;
  onEdit?: (user: User) => void;
  className?: string;
}

function getDisplayName(
  user: User
): string {
  const firstName =
    user.first_name?.trim() ?? "";

  const lastName =
    user.last_name?.trim() ?? "";

  const fullName = [
    firstName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    user.email ||
    "Unnamed user"
  );
}

function getInitials(
  user: User
): string {
  const name = getDisplayName(user);

  const parts = name
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }

  return name
    .slice(0, 2)
    .toUpperCase();
}

function formatValue(
  value?: string | null
): string {
  return value?.trim()
    ? value.trim()
    : "—";
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function formatLabel(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function isUser(
  value: unknown
): value is User {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value
  );
}

function extractUser(
  response: unknown
): User | null {
  if (isUser(response)) {
    return response;
  }

  if (
    !response ||
    typeof response !== "object"
  ) {
    return null;
  }

  const root =
    response as Record<
      string,
      unknown
    >;

  if (isUser(root.user)) {
    return root.user;
  }

  if (isUser(root.data)) {
    return root.data;
  }

  if (
    root.data &&
    typeof root.data === "object"
  ) {
    const data =
      root.data as Record<
        string,
        unknown
      >;

    if (isUser(data.user)) {
      return data.user;
    }
  }

  return null;
}

function getUsersFromResponse(
  response: unknown
): User[] {
  if (Array.isArray(response)) {
    return response.filter(isUser);
  }

  if (
    !response ||
    typeof response !== "object"
  ) {
    return [];
  }

  const root =
    response as Record<
      string,
      unknown
    >;

  if (Array.isArray(root.users)) {
    return root.users.filter(isUser);
  }

  if (Array.isArray(root.data)) {
    return root.data.filter(isUser);
  }

  if (
    root.data &&
    typeof root.data === "object"
  ) {
    const data =
      root.data as Record<
        string,
        unknown
      >;

    if (Array.isArray(data.users)) {
      return data.users.filter(isUser);
    }
  }

  return [];
}

function getErrorMessage(
  error: unknown
): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    const message = (
      error as {
        message?: unknown;
      }
    ).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Unable to retrieve this user.";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="admin-user-details__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function AdminUserDetails({
  userId,
  user: initialUser = null,
  onBack,
  onEdit,
  className = "",
}: AdminUserDetailsProps) {
  const [user, setUser] =
    useState<User | null>(
      initialUser
    );

  const [loading, setLoading] =
    useState(
      !initialUser
    );

  const [error, setError] =
    useState("");

  const loadUser = useCallback(
    async () => {
      if (!userId) {
        setUser(initialUser);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        /*
         * IMPORTANT:
         * Request the exact user ID directly.
         *
         * Do not use:
         *   getUsers({ search: userId })
         *
         * because search is not guaranteed to be
         * an exact identifier lookup.
         */
        const response =
          await apiGet<unknown>(
            `/api/users/${encodeURIComponent(
              userId
            )}`
          );

        const exactUser =
          extractUser(response);

        if (
          !exactUser ||
          exactUser.id !== userId
        ) {
          throw new Error(
            "The requested user could not be found."
          );
        }

        setUser(exactUser);
      } catch (requestError) {
        /*
         * Keep a controlled fallback for backends
         * that do not expose GET /api/users/:id.
         *
         * The fallback still verifies the returned
         * ID exactly before accepting the record.
         */
        try {
          const response =
            await getUsers({
              search: userId,
              page: 1,
              limit: 10,
            });

          const candidates =
            getUsersFromResponse(
              response
            );

          const exactUser =
            candidates.find(
              (candidate) =>
                candidate.id === userId
            ) ?? null;

          if (!exactUser) {
            throw new Error(
              "The requested user could not be found."
            );
          }

          setUser(exactUser);
          setError("");
        } catch (fallbackError) {
          setUser(initialUser);

          setError(
            getErrorMessage(
              fallbackError ||
                requestError
            )
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [
      userId,
      initialUser,
    ]
  );

  useEffect(() => {
    if (initialUser && !userId) {
      setUser(initialUser);
      setLoading(false);
      setError("");
      return;
    }

    void loadUser();
  }, [
    initialUser,
    userId,
    loadUser,
  ]);

  const handleRefresh =
    () => {
      void loadUser();
    };

  const containerClassName = [
    "admin-user-details",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <section
        className={containerClassName}
        aria-label="User details"
      >
        <LoadingScreen
          message="Loading user details…"
        />
      </section>
    );
  }

  if (!user) {
    return (
      <section
        className={containerClassName}
        aria-label="User details"
      >
        <EmptyState
          title="User not found"
          description="The requested user record could not be located."
          action={
            onBack ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onBack}
              >
                ← Back to users
              </Button>
            ) : undefined
          }
        />
      </section>
    );
  }

  return (
    <section
      className={containerClassName}
      aria-label="User details"
    >
      <div className="admin-user-details__toolbar">
        {onBack && (
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
          >
            ← Users
          </Button>
        )}

        <div className="admin-user-details__toolbar-actions">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>

          {onEdit && (
            <Button
              type="button"
              variant="primary"
              size="small"
              onClick={() =>
                onEdit(user)
              }
            >
              Edit user
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert
          variant="warning"
          title="Latest user data unavailable"
          className="admin-user-details__alert"
        >
          {error}

          <div className="admin-user-details__retry">
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={handleRefresh}
            >
              Try again
            </Button>
          </div>
        </Alert>
      )}

      <div className="admin-user-details__header">
        <div
          className="admin-user-details__avatar"
          aria-hidden="true"
        >
          {getInitials(user)}
        </div>

        <div className="admin-user-details__identity">
          <p className="admin-user-details__eyebrow">
            User account
          </p>

          <h2 className="admin-user-details__name">
            {getDisplayName(user)}
          </h2>

          <p className="admin-user-details__email">
            {formatValue(user.email)}
          </p>
        </div>
      </div>

      <div className="admin-user-details__grid">
        <section className="admin-user-details__card">
          <div className="admin-user-details__card-heading">
            <h3>Account information</h3>
          </div>

          <dl className="admin-user-details__list">
            <DetailRow
              label="User ID"
              value={formatValue(user.id)}
            />

            <DetailRow
              label="First name"
              value={formatValue(
                user.first_name
              )}
            />

            <DetailRow
              label="Last name"
              value={formatValue(
                user.last_name
              )}
            />

            <DetailRow
              label="Email"
              value={formatValue(
                user.email
              )}
            />

            <DetailRow
              label="Phone"
              value={formatValue(
                user.phone
              )}
            />
          </dl>
        </section>

        <section className="admin-user-details__card">
          <div className="admin-user-details__card-heading">
            <h3>Access & status</h3>
          </div>

          <dl className="admin-user-details__list">
            <DetailRow
              label="Role"
              value={formatLabel(
                user.role
              )}
            />

            <DetailRow
              label="Status"
              value={formatLabel(
                user.status
              )}
            />

            <DetailRow
              label="Created"
              value={formatDate(
                user.created_at
              )}
            />

            <DetailRow
              label="Updated"
              value={formatDate(
                user.updated_at
              )}
            />
          </dl>
        </section>

        <section className="admin-user-details__card admin-user-details__card--full">
          <div className="admin-user-details__card-heading">
            <h3>Account summary</h3>

            <p>
              Administrative information for this
              user account.
            </p>
          </div>

          <div className="admin-user-details__summary">
            <div className="admin-user-details__summary-item">
              <span>Role</span>

              <strong>
                {formatLabel(
                  user.role ||
                    "customer"
                )}
              </strong>
            </div>

            <div className="admin-user-details__summary-item">
              <span>Account status</span>

              <strong>
                {formatLabel(
                  user.status ||
                    "active"
                )}
              </strong>
            </div>

            <div className="admin-user-details__summary-item">
              <span>Member since</span>

              <strong>
                {formatDate(
                  user.created_at
                )}
              </strong>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}