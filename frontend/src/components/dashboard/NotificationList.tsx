import { useCallback, useMemo, useState } from "react";

import Alert from "../common/Alert";
import EmptyState from "../common/EmptyState";
import StatusBadge from "../common/StatusBadge";

import type { Notification } from "../../types";

interface NotificationListProps {
  notifications?: Notification[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onNotificationClick?: (
    notification: Notification,
  ) => void;
  className?: string;
}

function formatDate(
  value?: string | null,
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getNotificationStatus(
  notification: Notification,
): string {
  const value =
    notification.type ||
    notification.status ||
    "info";

  return String(value);
}

function getNotificationTitle(
  notification: Notification,
): string {
  return (
    notification.title ||
    "Notification"
  );
}

function getNotificationMessage(
  notification: Notification,
): string {
  return (
    notification.message ||
    notification.body ||
    ""
  );
}

function getNotificationDate(
  notification: Notification,
): string | null {
  return (
    notification.created_at ||
    notification.createdAt ||
    notification.updated_at ||
    null
  );
}

function isUnread(
  notification: Notification,
): boolean {
  if (
    typeof notification.read === "boolean"
  ) {
    return !notification.read;
  }

  if (
    typeof notification.is_read === "boolean"
  ) {
    return !notification.is_read;
  }

  if (
    typeof notification.isRead === "boolean"
  ) {
    return !notification.isRead;
  }

  return false;
}

export default function NotificationList({
  notifications = [],
  loading = false,
  error = "",
  onRetry,
  onNotificationClick,
  className = "",
}: NotificationListProps) {
  const [showUnreadOnly, setShowUnreadOnly] =
    useState(false);

  const filteredNotifications =
    useMemo(() => {
      if (!showUnreadOnly) {
        return notifications;
      }

      return notifications.filter(
        isUnread,
      );
    }, [
      notifications,
      showUnreadOnly,
    ]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        isUnread,
      ).length,
    [notifications],
  );

  const handleNotificationClick =
    useCallback(
      (
        notification: Notification,
      ) => {
        onNotificationClick?.(
          notification,
        );
      },
      [onNotificationClick],
    );

  if (loading) {
    return (
      <section
        className={`notification-list ${
          className
            ? `notification-list--${className}`
            : ""
        }`.trim()}
        aria-busy="true"
        aria-labelledby="notifications-title"
      >
        <div className="dashboard-section__header">
          <div>
            <h2 id="notifications-title">
              Notifications
            </h2>
            <p>
              Loading your latest
              notifications...
            </p>
          </div>
        </div>

        <div
          className="notification-list__loading"
          role="status"
        >
          <span
            className="loading-spinner"
            aria-hidden="true"
          />
          <span>
            Loading notifications...
          </span>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`notification-list ${
        className
          ? `notification-list--${className}`
          : ""
      }`.trim()}
      aria-labelledby="notifications-title"
    >
      <div className="dashboard-section__header">
        <div>
          <h2 id="notifications-title">
            Notifications
          </h2>

          <p>
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount === 1
                    ? ""
                    : "s"
                }`
              : "You're all caught up."}
          </p>
        </div>

        {notifications.length > 0 && (
          <label className="notification-list__filter">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(event) =>
                setShowUnreadOnly(
                  event.target.checked,
                )
              }
            />
            <span>
              Unread only
            </span>
          </label>
        )}
      </div>

      {error && (
        <Alert
          variant="error"
          title="Notifications unavailable"
        >
          <p>{error}</p>

          {onRetry && (
            <button
              type="button"
              className="button button--ghost"
              onClick={onRetry}
            >
              Try again
            </button>
          )}
        </Alert>
      )}

      {!error &&
        filteredNotifications.length ===
          0 && (
          <EmptyState
            title={
              showUnreadOnly
                ? "No unread notifications"
                : "No notifications"
            }
            description={
              showUnreadOnly
                ? "You have no unread notifications right now."
                : "New account and shipment updates will appear here."
            }
          />
        )}

      {!error &&
        filteredNotifications.length >
          0 && (
          <div
            className="notification-list__items"
            role="list"
          >
            {filteredNotifications.map(
              (notification) => {
                const unread =
                  isUnread(
                    notification,
                  );

                const title =
                  getNotificationTitle(
                    notification,
                  );

                const message =
                  getNotificationMessage(
                    notification,
                  );

                const date =
                  getNotificationDate(
                    notification,
                  );

                const status =
                  getNotificationStatus(
                    notification,
                  );

                const clickable =
                  Boolean(
                    onNotificationClick,
                  );

                return (
                  <article
                    key={
                      notification.id
                    }
                    className={`notification-list__item ${
                      unread
                        ? "notification-list__item--unread"
                        : ""
                    } ${
                      clickable
                        ? "notification-list__item--clickable"
                        : ""
                    }`.trim()}
                    role="listitem"
                    tabIndex={
                      clickable
                        ? 0
                        : undefined
                    }
                    onClick={() => {
                      if (
                        clickable
                      ) {
                        handleNotificationClick(
                          notification,
                        );
                      }
                    }}
                    onKeyDown={(
                      event,
                    ) => {
                      if (
                        !clickable
                      ) {
                        return;
                      }

                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {
                        event.preventDefault();
                        handleNotificationClick(
                          notification,
                        );
                      }
                    }}
                  >
                    <div className="notification-list__item-indicator">
                      <span
                        aria-hidden="true"
                      />
                    </div>

                    <div className="notification-list__item-content">
                      <div className="notification-list__item-header">
                        <h3>
                          {title}
                        </h3>

                        <StatusBadge
                          status={status}
                          size="small"
                        />
                      </div>

                      {message && (
                        <p>
                          {message}
                        </p>
                      )}

                      {date && (
                        <time
                          dateTime={date}
                          className="notification-list__date"
                        >
                          {formatDate(
                            date,
                          )}
                        </time>
                      )}
                    </div>

                    {unread && (
                      <span className="sr-only">
                        Unread
                      </span>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}
    </section>
  );
}