import type {
  ReactNode,
} from "react";

interface AlertProps {
  variant?:
    | "info"
    | "success"
    | "error"
    | "warning";

  title?: string;

  children: ReactNode;

  className?: string;

  dismissible?: boolean;

  onDismiss?: () => void;
}

export default function Alert({
  variant = "info",
  title,
  children,
  className = "",
  dismissible = false,
  onDismiss,
}: AlertProps) {
  const classes = [
    "alert",
    `alert--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const canDismiss =
    dismissible &&
    typeof onDismiss === "function";

  return (
    <div
      className={classes}
      role={
        variant === "error"
          ? "alert"
          : "status"
      }
      aria-live={
        variant === "error"
          ? "assertive"
          : "polite"
      }
    >
      <div className="alert__content">
        {title && (
          <strong className="alert__title">
            {title}
          </strong>
        )}

        <div className="alert__message">
          {children}
        </div>
      </div>

      {canDismiss && (
        <button
          type="button"
          className="alert__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
}