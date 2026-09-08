import type { KeyboardEvent } from "react";

import EmptyState from "../common/EmptyState";

import type { User } from "../../types";

interface AdminUserTableProps {
  users: User[];
  loading?: boolean;
  emptyMessage?: string;
  onUserSelect?: (user: User) => void;
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

function getRoleLabel(
  user: User
): string {
  const role =
    typeof user.role === "string"
      ? user.role
      : "";

  if (!role) {
    return "Customer";
  }

  return role
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getStatusLabel(
  user: User
): string {
  const status =
    typeof user.status === "string"
      ? user.status
      : "";

  if (!status) {
    return "Active";
  }

  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
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
    }
  ).format(date);
}

function handleKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  user: User,
  onUserSelect?: (user: User) => void
) {
  if (!onUserSelect) {
    return;
  }

  if (
    event.key === "Enter" ||
    event.key === " "
  ) {
    event.preventDefault();
    onUserSelect(user);
  }
}

export default function AdminUserTable({
  users,
  loading = false,
  emptyMessage = "No users were found.",
  onUserSelect,
  className = "",
}: AdminUserTableProps) {
  const tableClassName = [
    "shipment-table",
    "admin-user-table",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <div
        className={`${tableClassName} admin-user-table--loading`}
        aria-live="polite"
        aria-busy="true"
      >
        <div className="table-loading">
          <span
            className="app-loading__spinner"
            aria-hidden="true"
          />

          <span>
            Loading users…
          </span>
        </div>
      </div>
    );
  }

  if (!users.length) {
    return (
      <EmptyState
        title="No users found"
        description={emptyMessage}
        className="admin-user-table__empty"
      />
    );
  }

  return (
    <div className={tableClassName}>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">
            Dispatch Courier users
          </caption>

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
                Created
              </th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const clickable =
                Boolean(onUserSelect);

              return (
                <tr
                  key={user.id}
                  className={
                    clickable
                      ? "admin-user-table__row admin-user-table__row--clickable"
                      : "admin-user-table__row"
                  }
                  onClick={() =>
                    onUserSelect?.(user)
                  }
                  onKeyDown={(event) =>
                    handleKeyDown(
                      event,
                      user,
                      onUserSelect
                    )
                  }
                  tabIndex={
                    clickable ? 0 : undefined
                  }
                  role={
                    clickable
                      ? "button"
                      : undefined
                  }
                  aria-label={
                    clickable
                      ? `View ${getDisplayName(
                          user
                        )}`
                      : undefined
                  }
                >
                  <td>
                    <div className="admin-user-table__user">
                      <div
                        className="admin-user-table__avatar"
                        aria-hidden="true"
                      >
                        {getDisplayName(
                          user
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="admin-user-table__user-info">
                        <strong>
                          {getDisplayName(
                            user
                          )}
                        </strong>

                        {user.id && (
                          <span>
                            ID: {user.id}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="admin-user-table__email">
                      {user.email || "—"}
                    </span>
                  </td>

                  <td>
                    <span className="admin-user-table__role">
                      {getRoleLabel(user)}
                    </span>
                  </td>

                  <td>
                    <span className="admin-user-table__status">
                      {getStatusLabel(user)}
                    </span>
                  </td>

                  <td>
                    {user.phone || "—"}
                  </td>

                  <td>
                    {formatDate(
                      user.created_at
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}