import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ChangeEvent } from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import Input from "../common/Input";
import LoadingScreen from "../common/LoadingScreen";
import Select from "../common/Select";
import StatusBadge from "../common/StatusBadge";

import {
  apiDelete,
  getUsers,
} from "../../lib/api";

import type {
  Pagination,
  User,
  UserRole,
} from "../../types";

interface AdminUserManagementProps {
  onSelectUser?: (userId: string) => void;
  onEditUser?: (userId: string) => void;
  onCreateUser?: () => void;
  className?: string;
}

interface UsersResponse {
  data?: User[] | {
    users?: User[];
    data?: User[];
    pagination?: Partial<Pagination>;
    total?: number;
    page?: number;
    limit?: number;
    total_pages?: number;
  };
  users?: User[];
  pagination?: Partial<Pagination>;
  total?: number;
  page?: number;
  limit?: number;
  total_pages?: number;
}

type UserFilterRole =
  | "all"
  | UserRole
  | string;

const ROLE_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "customer", label: "Customer" },
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
  { value: "courier", label: "Courier" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function normalizePath(path: string): string {
  const value = path.replace(/\/+$/, "");
  return value || "/";
}

function getUserIdentifier(user: User): string {
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

function getUserRole(user: User): string {
  if (
    Array.isArray(user.roles) &&
    user.roles.length
  ) {
    return user.roles.join(", ");
  }

  if (user.role) {
    return String(user.role);
  }

  return "customer";
}

function getRoleLabel(role: string): string {
  return role
    .split(",")[0]
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function getUserStatus(
  user: User,
): "active" | "inactive" {
  return user.is_active === false
    ? "inactive"
    : "active";
}

function getInitials(user: User): string {
  const first =
    user.first_name?.trim().charAt(0) || "";

  const last =
    user.last_name?.trim().charAt(0) || "";

  if (first || last) {
    return `${first}${last}`
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    user.email?.trim().charAt(0).toUpperCase() ||
    "U"
  );
}

function readNumber(
  source: unknown,
  fallback: number,
): number {
  if (
    typeof source === "number" &&
    Number.isFinite(source)
  ) {
    return source;
  }

  if (
    typeof source === "string" &&
    source.trim() !== ""
  ) {
    const parsed = Number(source);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function extractUsers(
  response: unknown,
): {
  users: User[];
  pagination: Pagination;
} {
  const source =
    response &&
    typeof response === "object"
      ? (response as UsersResponse)
      : {};

  let users: User[] = [];

  if (Array.isArray(source.users)) {
    users = source.users;
  } else if (Array.isArray(source.data)) {
    users = source.data;
  } else if (
    source.data &&
    typeof source.data === "object"
  ) {
    if (Array.isArray(source.data.users)) {
      users = source.data.users;
    } else if (Array.isArray(source.data.data)) {
      users = source.data.data;
    }
  }

  const nestedPagination =
    source.data &&
    typeof source.data === "object" &&
    !Array.isArray(source.data)
      ? source.data.pagination
      : undefined;

  const paginationSource =
    source.pagination ||
    nestedPagination ||
    {};

  const nestedData =
    source.data &&
    typeof source.data === "object" &&
    !Array.isArray(source.data)
      ? source.data
      : undefined;

  const total = readNumber(
    source.total ??
      nestedData?.total ??
      paginationSource.total,
    users.length,
  );

  const page = readNumber(
    source.page ??
      nestedData?.page ??
      paginationSource.page,
    1,
  );

  const limit = readNumber(
    source.limit ??
      nestedData?.limit ??
      paginationSource.limit,
    20,
  );

  const calculatedTotalPages =
    Math.max(
      1,
      Math.ceil(
        total / Math.max(1, limit),
      ),
    );

  const totalPages = readNumber(
    source.total_pages ??
      nestedData?.total_pages ??
      paginationSource.total_pages,
    calculatedTotalPages,
  );

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.max(
        1,
        totalPages,
      ),
    },
  };
}

export default function AdminUserManagement({
  onSelectUser,
  onEditUser,
  onCreateUser,
  className = "",
}: AdminUserManagementProps) {
  const [users, setUsers] =
    useState<User[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [queryInput, setQueryInput] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [role, setRole] =
    useState<UserFilterRole>("all");

  const [status, setStatus] =
    useState<
      "all" | "active" | "inactive"
    >("all");

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 20,
      total: 0,
      total_pages: 1,
    });

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setQuery(
          queryInput.trim(),
        );

        setPage(1);
      }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [queryInput]);

  const loadUsers =
    useCallback(
      async (signal?: {
        cancelled: boolean;
      }) => {
        setLoading(true);
        setError("");

        try {
          /*
           * The API compatibility layer may have a
           * narrower getUsers parameter type than the
           * backend actually supports. Keep the role
           * filter while allowing the existing API
           * function to accept it safely.
           */
          const request =
            {
              search:
                query ||
                undefined,
              role:
                role !== "all"
                  ? role
                  : undefined,
              page,
              limit:
                pagination.limit,
            } as unknown as Parameters<
              typeof getUsers
            >[0];

          const response =
            await getUsers(request);

          if (
            signal?.cancelled
          ) {
            return;
          }

          const result =
            extractUsers(
              response,
            );

          setUsers(
            result.users,
          );

          setPagination(
            result.pagination,
          );
        } catch (
          requestError
        ) {
          if (
            signal?.cancelled
          ) {
            return;
          }

          setUsers([]);

          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Unable to load users.",
          );
        } finally {
          if (
            !signal?.cancelled
          ) {
            setLoading(false);
          }
        }
      },
      [
        query,
        role,
        page,
        pagination.limit,
      ],
    );

  useEffect(() => {
    const signal = {
      cancelled: false,
    };

    void loadUsers(signal);

    return () => {
      signal.cancelled = true;
    };
  }, [loadUsers]);

  const filteredUsers =
    useMemo(() => {
      if (status === "all") {
        return users;
      }

      return users.filter(
        (user) =>
          getUserStatus(user) ===
          status,
      );
    }, [users, status]);

  const totalPages =
    Math.max(
      1,
      Number(
        pagination.total_pages ??
          pagination.totalPages ??
          1,
      ),
    );

  const handleRoleChange =
    useCallback(
      (
        event: ChangeEvent<HTMLSelectElement>,
      ) => {
        setRole(
          event.target
            .value as UserFilterRole,
        );

        setPage(1);
      },
      [],
    );

  const handleStatusChange =
    useCallback(
      (
        event: ChangeEvent<HTMLSelectElement>,
      ) => {
        setStatus(
          event.target
            .value as
            | "all"
            | "active"
            | "inactive",
        );

        setPage(1);
      },
      [],
    );

  const handleSelect =
    useCallback(
      (user: User) => {
        const identifier =
          getUserIdentifier(user);

        if (!identifier) {
          return;
        }

        if (onSelectUser) {
          onSelectUser(
            identifier,
          );

          return;
        }

        const nextPath =
          `/admin/users/${encodeURIComponent(
            identifier,
          )}`;

        const currentPath =
          normalizePath(
            window.location.pathname,
          );

        if (
          currentPath ===
          nextPath
        ) {
          return;
        }

        window.history.pushState(
          {},
          "",
          nextPath,
        );

        window.dispatchEvent(
          new PopStateEvent(
            "popstate",
          ),
        );
      },
      [onSelectUser],
    );

  const handleEdit =
    useCallback(
      (user: User) => {
        const identifier =
          getUserIdentifier(user);

        if (!identifier) {
          return;
        }

        if (onEditUser) {
          onEditUser(
            identifier,
          );

          return;
        }

        const nextPath =
          `/admin/users/${encodeURIComponent(
            identifier,
          )}/edit`;

        const currentPath =
          normalizePath(
            window.location.pathname,
          );

        if (
          currentPath ===
          nextPath
        ) {
          return;
        }

        window.history.pushState(
          {},
          "",
          nextPath,
        );

        window.dispatchEvent(
          new PopStateEvent(
            "popstate",
          ),
        );
      },
      [onEditUser],
    );

  const handleDelete =
    useCallback(
      async (user: User) => {
        const identifier =
          getUserIdentifier(user);

        if (
          !identifier ||
          deletingId
        ) {
          return;
        }

        const confirmed =
          window.confirm(
            `Delete ${getDisplayName(
              user,
            )}? This action may remove the user from the administrative system.`,
          );

        if (!confirmed) {
          return;
        }

        setDeletingId(
          identifier,
        );

        setError("");
        setSuccess("");

        try {
          await apiDelete(
            `/api/users/${encodeURIComponent(
              identifier,
            )}`,
          );

          setUsers(
            (current) =>
              current.filter(
                (item) =>
                  getUserIdentifier(
                    item,
                  ) !==
                  identifier,
              ),
          );

          setPagination(
            (current) => ({
              ...current,
              total: Math.max(
                0,
                current.total - 1,
              ),
            }),
          );

          setSuccess(
            "User deleted successfully.",
          );
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Unable to delete the user.",
          );
        } finally {
          setDeletingId(null);
        }
      },
      [deletingId],
    );

  const handlePrevious =
    useCallback(() => {
      setPage((current) =>
        Math.max(
          1,
          current - 1,
        ),
      );
    }, []);

  const handleNext =
    useCallback(() => {
      setPage((current) =>
        Math.min(
          totalPages,
          current + 1,
        ),
      );
    }, [totalPages]);

  const handleRefresh =
    useCallback(() => {
      void loadUsers();
    }, [loadUsers]);

  const start =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) *
          pagination.limit +
        1;

  const end =
    pagination.total === 0
      ? 0
      : Math.min(
          pagination.total,
          pagination.page *
            pagination.limit,
        );

  return (
    <section
      className={`admin-user-management ${
        className
          ? `admin-user-management--${className}`
          : ""
      }`.trim()}
      aria-labelledby="admin-users-title"
    >
      <div className="page-heading">
        <div>
          <h1 id="admin-users-title">
            User Management
          </h1>

          <p>
            View, search, and manage Dispatch
            Courier users.
          </p>
        </div>

        <div className="button-row">
          <Button
            type="button"
            variant="secondary"
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() =>
              onCreateUser?.()
            }
          >
            Create user
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          variant="error"
          title="User management error"
          dismissible
          onDismiss={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          title="Success"
          dismissible
          onDismiss={() =>
            setSuccess("")
          }
        >
          {success}
        </Alert>
      )}

      <div className="admin-filters">
        <Input
          label="Search users"
          value={queryInput}
          onChange={(event) =>
            setQueryInput(
              event.target.value,
            )
          }
          placeholder="Name, email, or user ID"
        />

        <Select
          label="Role"
          value={role}
          onChange={
            handleRoleChange
          }
          options={
            ROLE_OPTIONS
          }
        />

        <Select
          label="Status"
          value={status}
          onChange={
            handleStatusChange
          }
          options={
            STATUS_OPTIONS
          }
        />
      </div>

      {loading &&
      users.length === 0 ? (
        <LoadingScreen
          message="Loading users..."
          fullScreen={false}
        />
      ) : filteredUsers.length ===
        0 ? (
        <EmptyState
          title="No users found"
          description={
            query ||
            role !== "all" ||
            status !== "all"
              ? "Try changing your search or filters."
              : "There are no users available to display."
          }
          action={
            onCreateUser
              ? {
                  label:
                    "Create user",
                  onClick:
                    onCreateUser,
                }
              : undefined
          }
        />
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">
                    User
                  </th>

                  <th scope="col">
                    Email
                  </th>

                  <th scope="col">
                    Role
                  </th>

                  <th scope="col">
                    Status
                  </th>

                  <th scope="col">
                    Phone
                  </th>

                  <th scope="col">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map(
                  (user) => {
                    const identifier =
                      getUserIdentifier(
                        user,
                      );

                    const roleValue =
                      getUserRole(
                        user,
                      );

                    const userStatus =
                      getUserStatus(
                        user,
                      );

                    const isDeleting =
                      deletingId ===
                      identifier;

                    return (
                      <tr
                        key={
                          identifier ||
                          `${user.email}-${user.first_name}-${user.last_name}`
                        }
                      >
                        <td>
                          <div className="admin-user-cell">
                            <span
                              className="admin-user-cell__avatar"
                              aria-hidden="true"
                            >
                              {getInitials(
                                user,
                              )}
                            </span>

                            <div>
                              <strong>
                                {getDisplayName(
                                  user,
                                )}
                              </strong>

                              {user.id && (
                                <small>
                                  {user.id}
                                </small>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          {user.email ||
                            "—"}
                        </td>

                        <td>
                          <span className="admin-role-label">
                            {getRoleLabel(
                              roleValue,
                            )}
                          </span>
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              userStatus ===
                              "active"
                                ? "delivered"
                                : "cancelled"
                            }
                            size="small"
                            showDot
                          />

                          <span className="sr-only">
                            {userStatus ===
                            "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          {user.phone ||
                            "—"}
                        </td>

                        <td>
                          <div className="table-actions">
                            <Button
                              type="button"
                              variant="secondary"
                              size="small"
                              onClick={() =>
                                handleSelect(
                                  user,
                                )
                              }
                            >
                              View
                            </Button>

                            <Button
                              type="button"
                              variant="secondary"
                              size="small"
                              onClick={() =>
                                handleEdit(
                                  user,
                                )
                              }
                            >
                              Edit
                            </Button>

                            <Button
                              type="button"
                              variant="danger"
                              size="small"
                              loading={
                                isDeleting
                              }
                              onClick={() =>
                                void handleDelete(
                                  user,
                                )
                              }
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span>
              Showing {start}–{end} of{" "}
              {pagination.total} users
            </span>

            <div className="pagination__actions">
              <Button
                type="button"
                variant="secondary"
                size="small"
                disabled={
                  pagination.page <=
                    1 ||
                  loading
                }
                onClick={
                  handlePrevious
                }
              >
                Previous
              </Button>

              <span
                className="pagination__page"
                aria-live="polite"
              >
                Page{" "}
                {pagination.page} of{" "}
                {totalPages}
              </span>

              <Button
                type="button"
                variant="secondary"
                size="small"
                disabled={
                  pagination.page >=
                    totalPages ||
                  loading
                }
                onClick={
                  handleNext
                }
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}