import {
  useId,
} from "react";

import type {
  InputHTMLAttributes,
} from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;

  error?: string;

  hint?: string;

  /**
   * Controls whether the visual required
   * marker is displayed beside the label.
   *
   * The native `required` attribute is still
   * controlled independently.
   */
  requiredMark?: boolean;
}

export default function Input({
  label,
  error,
  hint,
  id,
  className = "",
  requiredMark,
  required,
  ...props
}: InputProps) {
  const generatedId = useId();

  const inputId =
    id ||
    `input-${generatedId.replace(
      /:/g,
      ""
    )}`;

  const showRequiredMark =
    requiredMark ??
    Boolean(required);

  const inputClasses = [
    "input",
    error
      ? "input--error"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="field">
      {label && (
        <label
          className="field__label"
          htmlFor={inputId}
        >
          {label}

          {showRequiredMark && (
            <span
              aria-hidden="true"
            >
              {" "}
              *
            </span>
          )}
        </label>
      )}

      <input
        {...props}
        id={inputId}
        required={required}
        className={inputClasses}
        aria-invalid={
          error
            ? true
            : undefined
        }
        aria-describedby={
          error
            ? `${inputId}-error`
            : hint
              ? `${inputId}-hint`
              : undefined
        }
      />

      {error ? (
        <p
          id={`${inputId}-error`}
          className="field__error"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${inputId}-hint`}
          className="field__hint"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}