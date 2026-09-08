import {
  useCallback,
  type MouseEvent,
} from "react";

interface QuickActionsProps {
  onTrackShipment?: () => void;
  onViewShipments?: () => void;
  onViewProfile?: () => void;
  onContactSupport?: () => void;
  className?: string;
}

interface ActionItem {
  label: string;
  description: string;
  href: string;
  onClick?: () => void;
  icon: string;
}

function navigate(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
  callback?: () => void,
) {
  event.preventDefault();

  if (callback) {
    callback();
    return;
  }

  if (
    window.location.pathname === href
  ) {
    return;
  }

  window.history.pushState(
    null,
    "",
    href,
  );

  window.dispatchEvent(
    new PopStateEvent("popstate"),
  );
}

export default function QuickActions({
  onTrackShipment,
  onViewShipments,
  onViewProfile,
  onContactSupport,
  className = "",
}: QuickActionsProps) {
  const actions: ActionItem[] = [
    {
      label: "Track a shipment",
      description:
        "Check the current status and location of a shipment.",
      href: "/track",
      onClick: onTrackShipment,
      icon: "→",
    },
    {
      label: "View shipments",
      description:
        "Review your recent and active shipments.",
      href: "/dashboard/shipments",
      onClick: onViewShipments,
      icon: "▣",
    },
    {
      label: "My profile",
      description:
        "View and update your account information.",
      href: "/dashboard/profile",
      onClick: onViewProfile,
      icon: "○",
    },
    {
      label: "Contact support",
      description:
        "Get help with a shipment or your account.",
      href: "/dashboard/support",
      onClick: onContactSupport,
      icon: "?",
    },
  ];

  const handleAction =
    useCallback(
      (
        event: MouseEvent<HTMLAnchorElement>,
        action: ActionItem,
      ) => {
        navigate(
          event,
          action.href,
          action.onClick,
        );
      },
      [],
    );

  return (
    <section
      className={`quick-actions ${className}`.trim()}
      aria-labelledby="quick-actions-title"
    >
      <div className="section-heading">
        <div>
          <h2 id="quick-actions-title">
            Quick actions
          </h2>

          <p>
            Common tasks you can access quickly.
          </p>
        </div>
      </div>

      <div className="quick-actions__grid">
        {actions.map((action) => (
          <a
            key={action.href}
            href={action.href}
            className="quick-action"
            onClick={(event) =>
              handleAction(
                event,
                action,
              )
            }
          >
            <span
              className="quick-action__icon"
              aria-hidden="true"
            >
              {action.icon}
            </span>

            <span className="quick-action__content">
              <span className="quick-action__label">
                {action.label}
              </span>

              <span className="quick-action__description">
                {action.description}
              </span>
            </span>

            <span
              className="quick-action__arrow"
              aria-hidden="true"
            >
              →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}