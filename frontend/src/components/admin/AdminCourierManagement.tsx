import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import LoadingScreen from "../common/LoadingScreen";
import StatusBadge from "../common/StatusBadge";

import {
  apiDelete,
  getCouriers,
} from "../../lib/api";

import type { Courier } from "../../types";

interface AdminCourierPageProps {
  courierId?: string;
  className?: string;
}

interface CourierResponse {
  couriers?: Courier[];
  data?:
    | Courier[]
    | {
        couriers?: Courier[];
        data?: Courier[];
      };
}

function extractCouriers(
  response: unknown,
): Courier[] {
  if (!response || typeof response !== "object") {
    return [];
  }

  const source =
    response as CourierResponse;

  if (Array.isArray(source.couriers)) {
    return source.couriers;
  }

  if (Array.isArray(source.data)) {
    return source.data;
  }

  if (
    source.data &&
    typeof source.data === "object" &&
    !Array.isArray(source.data)
  ) {
    if (Array.isArray(source.data.couriers)) {
      return source.data.couriers;
    }

    if (Array.isArray(source.data.data)) {
      return source.data.data;
    }
  }

  return [];
}

function getIdentifier(
  courier: Courier,
): string {
  return (
    String(courier.id || "").trim() ||
    String(courier.user_id || "").trim()
  );
}

function getName(
  courier: Courier,
): string {
  const fullName =
    `${courier.first_name || ""} ${
      courier.last_name || ""
    }`.trim();

  return (
    fullName ||
    courier.name?.trim() ||
    courier.email?.trim() ||
    "Unknown courier"
  );
}

function getInitials(
  courier: Courier,
): string {
  const first =
    courier.first_name?.trim().charAt(0) ||
    "";

  const last =
    courier.last_name?.trim().charAt(0) ||
    "";

  if (first || last) {
    return `${first}${last}`
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    courier.name
      ?.trim()
      .charAt(0)
      .toUpperCase() || "C"
  );
}

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function AdminCourierPage({
  courierId,
  className = "",
}: AdminCourierPageProps) {
  const [courier, setCourier] =
    useState<Courier | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [removing, setRemoving] =
    useState(false);

  const loadCourier = useCallback(
    async () => {
      if (!courierId) {
        setCourier(null);
        setError(
          "No courier was selected.",
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await getCouriers({
            search: courierId,
          });

        const couriers =
          extractCouriers(response);

        const normalizedId =
          courierId.trim().toLowerCase();

        const match =
          couriers.find((item) => {
            const id =
              getIdentifier(item)
                .toLowerCase();

            const email =
              item.email
                ?.trim()
                .toLowerCase() || "";

            return (
              id === normalizedId ||
              email === normalizedId
            );
          }) || null;

        if (!match) {
          throw new Error(
            "Courier not found.",
          );
        }

        setCourier(match);
      } catch (requestError) {
        setCourier(null);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load courier details.",
        );
      } finally {
        setLoading(false);
      }
    },
    [courierId],
  );

  useEffect(() => {
    void loadCourier();
  }, [loadCourier]);

  const navigate = useCallback(
    (
      path: string,
      replace = false,
    ) => {
      const currentPath =
        window.location.pathname;

      if (currentPath === path) {
        return;
      }

      if (replace) {
        window.history.replaceState(
          {},
          "",
          path,
        );
      } else {
        window.history.pushState(
          {},
          "",
          path,
        );
      }

      window.dispatchEvent(
        new PopStateEvent("popstate"),
      );
    },
    [],
  );

  const handleBack = useCallback(() => {
    navigate("/admin/couriers");
  }, [navigate]);

  const handleRemove = useCallback(
    async () => {
      if (!courier) {
        return;
      }

      const identifier =
        getIdentifier(courier);

      if (!identifier) {
        setError(
          "This courier does not have a valid identifier.",
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Remove ${getName(
            courier,
          )} from courier management?`,
        );

      if (!confirmed) {
        return;
      }

      setRemoving(true);
      setError("");

      try {
        await apiDelete(
          `/api/couriers/${encodeURIComponent(
            identifier,
          )}`,
        );

        navigate(
          "/admin/couriers",
          true,
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to remove the courier.",
        );
      } finally {
        setRemoving(false);
      }
    },
    [courier, navigate],
  );

  if (loading) {
    return (
      <LoadingScreen
        message="Loading courier details..."
        fullScreen={false}
      />
    );
  }

  if (!courier) {
    return (
      <section
        className={`admin-courier-page ${
          className
            ? `admin-courier-page--${className}`
            : ""
        }`.trim()}
      >
        {error && (
          <Alert
            variant="error"
            title="Courier unavailable"
          >
            {error}
          </Alert>
        )}

        <EmptyState
          title="Courier not found"
          description="The requested courier could not be loaded."
          action={{
            label: "Back to couriers",
            onClick: handleBack,
          }}
        />
      </section>
    );
  }

  const identifier =
    getIdentifier(courier);

  const active =
    courier.is_active !== false;

  return (
    <section
      className={`admin-courier-page ${
        className
          ? `admin-courier-page--${className}`
          : ""
      }`.trim()}
      aria-labelledby="admin-courier-title"
    >
      <div className="page-heading">
        <div>
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={handleBack}
          >
            ← Back to couriers
          </button>

          <h1 id="admin-courier-title">
            Courier Details
          </h1>

          <p>
            Review the courier account and
            management information.
          </p>
        </div>

        <div className="button-row">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              void loadCourier()
            }
          >
            Refresh
          </Button>

          <Button
            type="button"
            variant="danger"
            loading={removing}
            onClick={() =>
              void handleRemove()
            }
          >
            Remove courier
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Courier management error"
          dismissible
          onDismiss={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <div className="admin-detail-grid">
        <article className="card admin-profile-card">
          <div className="admin-profile-card__header">
            <div className="admin-user-cell">
              <span
                className="admin-user-cell__avatar admin-user-cell__avatar--large"
                aria-hidden="true"
              >
                {getInitials(courier)}
              </span>

              <div>
                <h2>
                  {getName(courier)}
                </h2>

                <p>
                  {courier.email || "No email"}
                </p>
              </div>
            </div>

            <StatusBadge
              status={
                active
                  ? "delivered"
                  : "cancelled"
              }
              showDot
            />

            <span className="sr-only">
              {active
                ? "Active"
                : "Inactive"}
            </span>
          </div>

          <div className="detail-list">
            <div className="detail-list__item">
              <span>Courier ID</span>
              <strong>
                {identifier || "—"}
              </strong>
            </div>

            <div className="detail-list__item">
              <span>First name</span>
              <strong>
                {courier.first_name ||
                  "—"}
              </strong>
            </div>

            <div className="detail-list__item">
              <span>Last name</span>
              <strong>
                {courier.last_name ||
                  "—"}
              </strong>
            </div>

            <div className="detail-list__item">
              <span>Email</span>
              <strong>
                {courier.email || "—"}
              </strong>
            </div>

            <div className="detail-list__item">
              <span>Phone</span>
              <strong>
                {courier.phone || "—"}
              </strong>
            </div>

            <div className="detail-list__item">
              <span>Status</span>
              <strong>
                {active
                  ? "Active"
                  : "Inactive"}
              </strong>
            </div>

            <div className="detail-list__item">
              <span>Created</span>
              <strong>
                {formatDate(
                  courier.created_at,
                )}
              </strong>
            </div>

            <div className="detail-list__item">
              <span>Last updated</span>
              <strong>
                {formatDate(
                  courier.updated_at,
                )}
              </strong>
            </div>
          </div>
        </article>

        <aside className="card admin-side-card">
          <h2>Courier management</h2>

          <p>
            Use the actions on this page to
            review the courier account or
            remove it from active courier
            management.
          </p>

          <div className="button-stack">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
            >
              View all couriers
            </Button>

            <Button
              type="button"
              variant="danger"
              loading={removing}
              onClick={() =>
                void handleRemove()
              }
            >
              Remove courier
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}