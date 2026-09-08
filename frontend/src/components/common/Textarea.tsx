/* =========================================================
   Dispatch Courier
   Reusable Textarea Component
   ========================================================= */

import {
  forwardRef,
  useId,
} from "react";

import type {
  TextareaHTMLAttributes,
} from "react";


/* =========================================================
   Types
   ========================================================= */

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;

  error?: string;

  hint?: string;

  requiredMark?: boolean;
}


/* =========================================================
   Component
   ========================================================= */

const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(
  function Textarea(
    {
      id,

      label,

      error,

      hint,

      requiredMark = false,

      className = "",

      required,

      disabled,

      ...props
    },
    ref
  ) {
    const generatedId =
      useId();

    const textareaId =
      id ||
      `dc-textarea-${generatedId}`;

    const errorId =
      `${textareaId}-error`;

    const hintId =
      `${textareaId}-hint`;

    const describedBy =
      [
        hint
          ? hintId
          : null,

        error
          ? errorId
          : null,
      ]
        .filter(Boolean)
        .join(" ") ||
      undefined;


    const textareaClasses = [
      "form-textarea",

      error
        ? "form-textarea--error"
        : "",

      className,
    ]
      .filter(Boolean)
      .join(" ");


    return (
      <div className="form-field">
        {/* -------------------------------------------------
            Label
            ------------------------------------------------- */}

        {label && (
          <label
            className="form-label"
            htmlFor={textareaId}
          >
            {label}

            {(required ||
              requiredMark) && (
              <span
                className="form-label__required"
                aria-hidden="true"
              >
                {" "}
                *
              </span>
            )}
          </label>
        )}


        {/* -------------------------------------------------
            Textarea
            ------------------------------------------------- */}

        <textarea
          {...props}
          ref={ref}
          id={textareaId}
          className={textareaClasses}
          required={required}
          disabled={disabled}
          aria-invalid={
            error
              ? true
              : undefined
          }
          aria-describedby={
            describedBy
          }
        />


        {/* -------------------------------------------------
            Hint
            ------------------------------------------------- */}

        {hint && !error && (
          <p
            id={hintId}
            className="form-hint"
          >
            {hint}
          </p>
        )}


        {/* -------------------------------------------------
            Error
            ------------------------------------------------- */}

        {error && (
          <p
            id={errorId}
            className="form-error"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);


Textarea.displayName =
  "Textarea";


export default Textarea;