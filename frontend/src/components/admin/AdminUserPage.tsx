import { useCallback, useEffect, useState } from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import LoadingScreen from "../common/LoadingScreen";
import AdminUserForm from "./AdminUserForm";

import {
  apiDelete,
  getUsers,
} from "../../lib/api";

import type { User } from "../../types";

type AdminUserPageMode =
  | "details"
  | "new"
  | "edit";

interface AdminUserPageProps {
  userId?: string;
  mode?: AdminUserPageMode;
  className?: string;
}

interface UsersResponse {
  users?: User[];
  data?:
    | User[]
    | {
        users?: User[];
        data?: User[];
      };
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
  const currentPath = normalizePath(
    window.location.pathname,
  );

  if (currentPath === nextPath) {
    return;
  }

  if (replace) {
    window.history.replaceState({}, "", nextPath);
  } else {
    window.history.pushState({}, "", nextPath);
  }

  window.dispatchEvent(
    new PopStateEvent("popstate"),
  );
}

function getIdentifier(user: User): string {
  return (
    String(user.id || "").trim() ||
    String(user.email || "").trim()
  );
}

function getDisplayName(user: User): string {
  const name = [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user.email || "Unknown user";
}

function extractUsers(
  response: unknown,
): User[] {
  if (!response || typeof response !== "object") {
    return [];
  }

  const source =
    response as UsersResponse;

  if (Array.isArray(source.users)) {
    return source.users;
  }

  if (Array.isArray(source.data)) {
    return source.data;
  }

  if (
    source.data &&
    typeof source.data === "object" &&
    !Array.isArray(source.data)
  ) {
    if (Array.isArray(source.data.users)) {
      return source.data.users;
    }

    if (Array.isArray(source.data.data)) {
      return source.data.data;
    }
  }

  return [];
}

export default function AdminUserPage({
  userId,
  mode = "details",
  className = "",
}: AdminUserPageProps) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(mode !== "new");

  const [error, setError] =
    useState("");

  const [deleting, setDeleting] =
    useState(false);

  const loadUser = useCallback(async () => {
    if (mode === "new") {
      setUser(null);
      setLoading(false);
      setError("");
      return;
    }

    const identifier = userId?.trim();

    if (!identifier) {
      setUser(null);
      setLoading(false);
      setError(
        "No user identifier was provided.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getUsers({
        search: identifier,
        page: 1,
        limit: 50,
      });

      const users = extractUsers(response);

      const exactMatch =
        users.find(
          (item) =>
            String(item.id || "") ===
              identifier ||
            String(item.email || "")
              .toLowerCase() ===
              identifier.toLowerCase(),
        ) || users[0];

      if (!exactMatch) {
        throw new Error(
          "User information is unavailable.",
        );
      }

      setUser(exactMatch);
    } catch (requestError) {
      setUser(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the user.",
      );
    } finally {
      setLoading(false);
    }
  }, [mode, userId]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (mode === "new") {
      document.title =
        "Create User — Dispatch Courier";
      return;
    }

    if (mode === "edit") {
      document.title =
        user?.email
          ? `Edit ${user.email} — Dispatch Courier`
          : "Edit User — Dispatch Courier";
      return;
    }

    document.title =
      user?.email
        ? `${user.email} — Dispatch Courier`
        : "User Details — Dispatch Courier";
  }, [mode, user]);

  const handleBack = useCallback(() => {
    navigate("/admin/users");
  }, []);

  const handleSaved = useCallback(
    (savedUser?: User) => {
      const identifier =
        savedUser?.id ||
        savedUser?.email ||
        user?.id ||
        user?.email;

      if (!identifier) {
        navigate("/admin/users", true);
        return;
      }

      navigate(
        `/admin/users/${encodeURIComponent(
          identifier,
        )}`,
        true,
      );
    },
    [user],
  );

  const handleEdit = useCallback(() => {
    const identifier =
      user?.id || user?.email;

    if (!identifier) {
      setError(
        "This user cannot be edited because no identifier is available.",
      );
      return;
    }

    navigate(
      `/admin/users/${encodeURIComponent(
        identifier,
      )}/edit`,
    );
  }, [user]);

  const handleDelete = useCallback(async () => {
    if (!user || deleting) {
      return;
    }

    const identifier = getIdentifier(user);

    if (!identifier) {
      setError(
        "This user cannot be deleted because no identifier is available.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete ${getDisplayName(user)}? This action may remove the user from the administrative system.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await apiDelete(
        `/api/users/${encodeURIComponent(
          identifier,
        )}`,
      );

      navigate(
        "/admin/users",
        true,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete the user.",
      );
    } finally {
      setDeleting(false);
    }
  }, [deleting, user]);

  if (mode === "new") {
    return (
      <div
        className={`admin-user-page ${
          className
            ? `admin-user-page--${className}`
            : ""
        }`.trim()}
      >
        <div className="page-heading">
          <h1>Create User</h1>
          <p>
            Create a new Dispatch Courier user.
          </p>
        </div>

        <AdminUserForm
          onSaved={handleSaved}
          onCancel={handleBack}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`admin-user-page ${
          className
            ? `admin-user-page--${className}`
            : ""
        }`.trim()}
      >
        <LoadingScreen
          message="Loading user..."
          fullScreen={false}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={`admin-user-page ${
          className
            ? `admin-user-page--${className}`
            : ""
        }`.trim()}
      >
        {error ? (
          <Alert
            variant="error"
            title="User unavailable"
          >
            {error}
          </Alert>
        ) : (
          <EmptyState
            title="User not found"
            description="The requested user could not be found."
          />
        )}

        <div className="button-row">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              void loadUser()
            }
          >
            Try again
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
          >
            Back to users
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div
        className={`admin-user-page ${
          className
            ? `admin-user-page--${className}`
            : ""
        }`.trim()}
      >
        <div className="page-heading">
          <h1>Edit User</h1>
          <p>
            Update the user's account information.
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

        <AdminUserForm
          user={user}
          onSaved={handleSaved}
          onCancel={handleBack}
        />
      </div>
    );
  }

  const identifier = getIdentifier(user);

  const role =
    Array.isArray(user.roles) &&
    user.roles.length
      ? user.roles.join(", ")
      : user.role || "customer";

  const status =
    user.is_active === false
      ? "Inactive"
      : "Active";

  return (
    <div
      className={`admin-user-page ${
        className
          ? `admin-user-page--${className}`
          : ""
      }`.trim()}
    >
      <div className="page-heading">
        <div>
          <h1>User Details</h1>
          <p>
            Review and manage this user's
            account.
          </p>
        </div>

        <div className="button-row">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
          >
            Back to users
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleEdit}
          >
            Edit user
          </Button>

          <Button
            type="button"
            variant="danger"
            loading={deleting}
            onClick={() =>
              void handleDelete()
            }
          >
            Delete user
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          variant="error"
          title="User management error"
          dismissible
          onDismiss={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <section className="admin-detail-card">
        <div className="admin-detail-card__header">
          <div className="admin-user-cell">
            <span
              className="admin-user-cell__avatar"
              aria-hidden="true"
            >
              {(
                user.first_name?.charAt(0) ||
                user.last_name?.charAt(0) ||
                user.email?.charAt(0) ||
                "U"
              )
                .toUpperCase()
                .slice(0, 2)}
            </span>

            <div>
              <h2>
                {getDisplayName(user)}
              </h2>
              <p>{user.email || "—"}</p>
            </div>
          </div>
        </div>

        <div className="admin-detail-grid">
          <div className="admin-detail-item">
            <span>Name</span>
            <strong>
              {getDisplayName(user)}
            </strong>
          </div>

          <div className="admin-detail-item">
            <span>Email</span>
            <strong>
              {user.email || "—"}
            </strong>
          </div>

          <div className="admin-detail-item">
            <span>Phone</span>
            <strong>
              {user.phone || "—"}
            </strong>
          </div>

          <div className="admin-detail-item">
            <span>Role</span>
            <strong>{role}</strong>
          </div>

          <div className="admin-detail-item">
            <span>Status</span>
            <strong>{status}</strong>
          </div>

          <div className="admin-detail-item">
            <span>User ID</span>
            <strong>
              {identifier || "—"}
            </strong>
          </div>

          <div className="admin-detail-item">
            <span>Created</span>
            <strong>
              {user.created_at
                ? new Date(
                    user.created_at,
                  ).toLocaleString()
                : "—"}
            </strong>
          </div>

          <div className="admin-detail-item">
            <span>Last updated</span>
            <strong>
              {user.updated_at
                ? new Date(
                    user.updated_at,
                  ).toLocaleString()
                : "—"}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}