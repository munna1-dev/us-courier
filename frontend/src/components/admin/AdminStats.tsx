import type { ReactNode } from "react";

interface AdminStatsProps {
  totalShipments?: number;
  pendingShipments?: number;
  inTransitShipments?: number;
  deliveredShipments?: number;
  totalUsers?: number;
  activeUsers?: number;
  totalCouriers?: number;
  className?: string;
}

interface StatItem {
  key: string;
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat(
    "en-US",
  ).format(value);
}

function StatIcon({
  type,
}: {
  type: StatItem["key"];
}) {
  switch (type) {
    case "shipments":
      return (
        <span
          aria-hidden="true"
          className="admin-stat__icon-symbol"
        >
          ▣
        </span>
      );

    case "pending":
      return (
        <span
          aria-hidden="true"
          className="admin-stat__icon-symbol"
        >
          ◷
        </span>
      );

    case "transit":
      return (
        <span
          aria-hidden="true"
          className="admin-stat__icon-symbol"
        >
          →
        </span>
      );

    case "delivered":
      return (
        <span
          aria-hidden="true"
          className="admin-stat__icon-symbol"
        >
          ✓
        </span>
      );

    case "users":
      return (
        <span
          aria-hidden="true"
          className="admin-stat__icon-symbol"
        >
          ◉
        </span>
      );

    case "active-users":
      return (
        <span
          aria-hidden="true"
          className="admin-stat__icon-symbol"
        >
          ●
        </span>
      );

    case "couriers":
      return (
        <span
          aria-hidden="true"
          className="admin-stat__icon-symbol"
        >
          ◇
        </span>
      );

    default:
      return (
        <span
          aria-hidden="true"
          className="admin-stat__icon-symbol"
        >
          •
        </span>
      );
  }
}

export default function AdminStats({
  totalShipments = 0,
  pendingShipments = 0,
  inTransitShipments = 0,
  deliveredShipments = 0,
  totalUsers = 0,
  activeUsers = 0,
  totalCouriers = 0,
  className = "",
}: AdminStatsProps) {
  const stats: StatItem[] = [
    {
      key: "shipments",
      label: "Total shipments",
      value: totalShipments,
      description:
        "All shipments in the system",
      icon: (
        <StatIcon type="shipments" />
      ),
    },
    {
      key: "pending",
      label: "Pending shipments",
      value: pendingShipments,
      description:
        "Shipments awaiting processing",
      icon: (
        <StatIcon type="pending" />
      ),
    },
    {
      key: "transit",
      label: "In transit",
      value: inTransitShipments,
      description:
        "Shipments currently moving",
      icon: (
        <StatIcon type="transit" />
      ),
    },
    {
      key: "delivered",
      label: "Delivered",
      value: deliveredShipments,
      description:
        "Successfully delivered shipments",
      icon: (
        <StatIcon type="delivered" />
      ),
    },
    {
      key: "users",
      label: "Total users",
      value: totalUsers,
      description:
        "Registered platform users",
      icon: (
        <StatIcon type="users" />
      ),
    },
    {
      key: "active-users",
      label: "Active users",
      value: activeUsers,
      description:
        "Users currently active",
      icon: (
        <StatIcon type="active-users" />
      ),
    },
    {
      key: "couriers",
      label: "Couriers",
      value: totalCouriers,
      description:
        "Registered courier personnel",
      icon: (
        <StatIcon type="couriers" />
      ),
    },
  ];

  return (
    <section
      className={`admin-stats ${
        className
          ? `admin-stats--${className}`
          : ""
      }`.trim()}
      aria-labelledby="admin-stats-title"
    >
      <div className="admin-stats__header">
        <div>
          <h2 id="admin-stats-title">
            Operations overview
          </h2>

          <p>
            Current platform activity
            and shipment performance.
          </p>
        </div>
      </div>

      <div className="admin-stats__grid">
        {stats.map((stat) => (
          <article
            key={stat.key}
            className="admin-stat"
          >
            <div className="admin-stat__top">
              <div
                className="admin-stat__icon"
                aria-hidden="true"
              >
                {stat.icon}
              </div>
            </div>

            <div className="admin-stat__body">
              <p className="admin-stat__label">
                {stat.label}
              </p>

              <p className="admin-stat__value">
                {formatNumber(
                  stat.value,
                )}
              </p>

              <p className="admin-stat__description">
                {stat.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}