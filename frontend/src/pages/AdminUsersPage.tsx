import {
  useEffect,
  useState,
} from "react";

import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

import {
  getAdminUser,
  getAdminUsers,
  updateAdminUser,
} from "../lib/api";

import type {
  User,
} from "../types";

interface AdminUsersPageProps {
  initialUserId?: string;
}

export default function AdminUsersPage({
  initialUserId,
}: AdminUsersPageProps) {
  const [users, setUsers] =
    useState<User[]>([]);

  const [
    selectedUser,
    setSelectedUser,
  ] = useState<User | null>(
    null
  );

  const [search, setSearch] =
    useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    async function load() {
      try {
        const list =
          await getAdminUsers();

        setUsers(list);

        if (initialUserId) {
          const found =
            list.find(
              (item) =>
                item.id ===
                initialUserId
            );

          if (found) {
            setSelectedUser(
              found
            );
          } else {
            const user =
              await getAdminUser(
                initialUserId
              );

            setSelectedUser(
              user
            );
          }
        }
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load users."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [initialUserId]);

  async function saveUser() {
    if (!selectedUser) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated =
        await updateAdminUser(
          selectedUser.id,
          {
            first_name:
              selectedUser.first_name ??
              selectedUser.firstName ??
              "",
            last_name:
              selectedUser.last_name ??
              selectedUser.lastName ??
              "",
            email:
              selectedUser.email,
            phone:
              selectedUser.phone ??
              "",
            role:
              selectedUser.role ??
              "customer",
            status:
              selectedUser.status ??
              "active",
          }
        );

      setSelectedUser(
        updated
      );

      setUsers((current) =>
        current.map(
          (user) =>
            user.id ===
            updated.id
              ? updated
              : user
        )
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update user."
      );
    } finally {
      setSaving(false);
    }
  }

  const filtered =
    users.filter((user) => {
      const name =
        `${user.first_name ?? user.firstName ?? ""} ${
          user.last_name ??
          user.lastName ??
          ""
        }`.toLowerCase();

      return (
        name.includes(
          search.toLowerCase()
        ) ||
        user.email
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
      );
    });

  return (
    <main className="dashboard-page">
      <div className="page-shell">
        <div className="dashboard-header">
          <div>
            <p className="page-eyebrow">
              Administration
            </p>

            <h1>
              User management
            </h1>
          </div>

          <Button
            variant="secondary"
            onClick={() =>
              (window.location.href =
                "/admin")
            }
          >
            ← Dashboard
          </Button>
        </div>

        {error && (
          <Alert
            variant="error"
            title="User management"
          >
            {error}
          </Alert>
        )}

        <div className="admin-split">
          <section className="admin-panel">
            <Input
              label="Search users"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Name or email"
            />

            {loading ? (
              <div className="loading-state">
                Loading users...
              </div>
            ) : (
              <div className="admin-list">
                {filtered.map(
                  (user) => (
                    <button
                      type="button"
                      className={`admin-list__item ${
                        selectedUser?.id ===
                        user.id
                          ? "is-selected"
                          : ""
                      }`}
                      key={user.id}
                      onClick={() =>
                        setSelectedUser(
                          user
                        )
                      }
                    >
                      <strong>
                        {user.first_name ??
                          user.firstName ??
                          ""}{" "}
                        {user.last_name ??
                          user.lastName ??
                          ""}
                      </strong>

                      <span>
                        {user.email}
                      </span>

                      <small>
                        {user.role ??
                          "customer"}
                      </small>
                    </button>
                  )
                )}
              </div>
            )}
          </section>

          <section className="admin-panel">
            {selectedUser ? (
              <>
                <h2>
                  Edit user
                </h2>

                <div className="admin-form-grid">
                  <Input
                    label="First name"
                    value={
                      selectedUser.first_name ??
                      selectedUser.firstName ??
                      ""
                    }
                    onChange={(event) =>
                      setSelectedUser(
                        {
                          ...selectedUser,
                          first_name:
                            event.target
                              .value,
                        }
                      )
                    }
                    disabled={saving}
                  />

                  <Input
                    label="Last name"
                    value={
                      selectedUser.last_name ??
                      selectedUser.lastName ??
                      ""
                    }
                    onChange={(event) =>
                      setSelectedUser(
                        {
                          ...selectedUser,
                          last_name:
                            event.target
                              .value,
                        }
                      )
                    }
                    disabled={saving}
                  />

                  <Input
                    label="Email"
                    value={
                      selectedUser.email
                    }
                    onChange={(event) =>
                      setSelectedUser(
                        {
                          ...selectedUser,
                          email:
                            event.target
                              .value,
                        }
                      )
                    }
                    disabled={saving}
                  />
                </div>

                <div className="admin-actions">
                  <Button
                    loading={saving}
                    onClick={
                      saveUser
                    }
                  >
                    Save changes
                  </Button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h2>
                  Select a user
                </h2>

                <p>
                  Choose a user from
                  the list to review
                  their account.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}