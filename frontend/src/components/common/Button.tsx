import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost";

type ButtonSize =
  | "small"
  | "medium"
  | "large";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;

  size?: ButtonSize;

  loading?: boolean;

  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "medium",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const classes = [
    "button",
    `button--${variant}`,
    `button--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      className={classes}
      disabled={
        disabled || loading
      }
      aria-busy={
        loading || undefined
      }
    >
      {loading ? (
        <>
          <span
            className="button__spinner"
            aria-hidden="true"
          />

          <span>
            Saving...
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}