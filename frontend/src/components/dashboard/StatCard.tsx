import { useCallback } from "react";
import type { MouseEvent, ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: string;
  href?: string;
  loading?: boolean;
  className?: string;
}

export default function StatCard({
  label,
  value,
  description,
  icon,
  trend,
  href,
  loading = false,
  className = "",
}: StatCardProps) {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!href) {
        event.preventDefault();
        return;
      }

      /*
       * Allow the application router to handle internal
       * dashboard navigation without creating a second
       * history entry here.
       */
      if (
        href.startsWith("/") &&
        !href.startsWith("//")
      ) {
        event.preventDefault();

        const currentPath =
          window.location.pathname.replace(/\/+$/, "") ||
          "/";

        const nextPath =
          href.replace(/\/+$/, "") || "/";

        if (currentPath === nextPath) {
          return;
        }

        window.history.pushState({}, "", nextPath);
        window.dispatchEvent(
          new PopStateEvent("popstate"),
        );
      }
    },
    [href],
  );

  const content = (
    <>
      <div className="stat-card__top">
        <div className="stat-card__label">
          {label}
        </div>

        {icon && (
          <div
            className="stat-card__icon"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      <div
        className={`stat-card__value ${
          loading ? "stat-card__value--loading" : ""
        }`}
        aria-live="polite"
      >
        {loading ? (
          <span
            className="stat-card__skeleton"
            aria-label={`Loading ${label}`}
          />
        ) : (
          value
        )}
      </div>

      {(description || trend) && (
        <div className="stat-card__bottom">
          {description && (
            <span className="stat-card__description">
              {description}
            </span>
          )}

          {trend && !loading && (
            <span className="stat-card__trend">
              {trend}
            </span>
          )}
        </div>
      )}
    </>
  );

  const cardClassName = [
    "stat-card",
    href ? "stat-card--link" : "",
    loading ? "stat-card--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (!href) {
    return (
      <article className={cardClassName}>
        {content}
      </article>
    );
  }

  return (
    <a
      href={href}
      className={cardClassName}
      onClick={handleClick}
      aria-label={`${label}: ${
        loading ? "loading" : value
      }`}
    >
      {content}
    </a>
  );
}