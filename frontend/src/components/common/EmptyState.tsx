import type {
  ReactNode,
} from "react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  message?: string;
  icon?: ReactNode;
  action?:
    | ReactNode
    | EmptyStateAction;
  className?: string;
}

function isActionObject(
  action: EmptyStateProps["action"]
): action is EmptyStateAction {
  return (
    typeof action === "object" &&
    action !== null &&
    !Array.isArray(action) &&
    "label" in action &&
    "onClick" in action &&
    typeof action.label ===
      "string" &&
    typeof action.onClick ===
      "function"
  );
}

export default function EmptyState({
  title = "No results found",
  description,
  message,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  const containerClassName = [
    "empty-state",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const bodyText =
    description ??
    message;

  return (
    <section
      className={containerClassName}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <div
          className="empty-state__icon"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <div className="empty-state__content">
        <h3 className="empty-state__title">
          {title}
        </h3>

        {bodyText && (
          <p className="empty-state__description">
            {bodyText}
          </p>
        )}

        {action && (
          <div className="empty-state__action">
            {isActionObject(action) ? (
              <button
                type="button"
                className="button button--primary"
                onClick={
                  action.onClick
                }
                disabled={
                  action.disabled
                }
              >
                {action.label}
              </button>
            ) : (
              action
            )}
          </div>
        )}
      </div>
    </section>
  );
}