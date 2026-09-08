import { useCallback, useState } from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import ProfileForm from "./ProfileForm";

import type { User } from "../../types";

interface ProfileCardProps {
  user: User;
  className?: string;
}

function getDisplayName(user: User): string {
  const name = [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user.email || "Customer";
}

function formatRole(role?: string | null): string {
  if (!role) return "Customer";

  return role
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default function ProfileCard({
  user,
  className = "",
}: ProfileCardProps) {
  const [editing, setEditing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const handleEdit =
    useCallback(() => {
      setMessage("");
      setEditing(true);
    }, []);

  const handleCancel =
    useCallback(() => {
      setMessage("");
      setEditing(false);
    }, []);

  const handleSaved =
    useCallback(() => {
      setEditing(false);
      setMessage(
        "Your profile has been updated successfully.",
      );
    }, []);

  const displayName =
    getDisplayName(user);

  return (
    <section
      className={`profile-card ${
        className
          ? `profile-card--${className}`
          : ""
      }`.trim()}
      aria-labelledby="profile-title"
    >
      <div className="dashboard-section__header">
        <div>
          <h1 id="profile-title">
            My Profile
          </h1>

          <p>
            Review and manage your
            account information.
          </p>
        </div>

        {!editing && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleEdit}
          >
            Edit profile
          </Button>
        )}
      </div>

      {message && (
        <Alert
          variant="success"
          title="Profile updated"
          dismissible
          onDismiss={() =>
            setMessage("")
          }
        >
          {message}
        </Alert>
      )}

      {editing ? (
        <ProfileForm
          user={user}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      ) : (
        <div className="profile-card__content">
          <div className="profile-card__identity">
            <div
              className="profile-card__avatar"
              aria-hidden="true"
            >
              {displayName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <h2>
                {displayName}
              </h2>

              <p>
                {user.email ||
                  "No email address"}
              </p>
            </div>
          </div>

          <dl className="profile-card__details">
            <div>
              <dt>First name</dt>
              <dd>
                {user.first_name ||
                  "—"}
              </dd>
            </div>

            <div>
              <dt>Last name</dt>
              <dd>
                {user.last_name ||
                  "—"}
              </dd>
            </div>

            <div>
              <dt>Email</dt>
              <dd>
                {user.email ||
                  "—"}
              </dd>
            </div>

            <div>
              <dt>Phone</dt>
              <dd>
                {user.phone ||
                  "—"}
              </dd>
            </div>

            <div>
              <dt>Account role</dt>
              <dd>
                {formatRole(
                  user.role,
                )}
              </dd>
            </div>

            <div>
              <dt>Account status</dt>
              <dd>
                {formatRole(
                  user.status,
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}