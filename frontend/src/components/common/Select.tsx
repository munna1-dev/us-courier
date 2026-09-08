import {
  type ChangeEvent,
  type SelectHTMLAttributes,
} from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "value" | "onChange"
  > {
  label?: string;
  value?: string;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
  placeholder?: string;
  onChange?: (
    event: ChangeEvent<HTMLSelectElement>
  ) => void;
  containerClassName?: string;
}

export default function Select({
  label,
  value = "",
  options = [],
  error,
  helperText,
  placeholder,
  onChange,
  containerClassName = "",
  id,
  name,
  required,
  disabled,
  className = "",
  ...rest
}: SelectProps) {
  const generatedId =
    id ||
    name ||
    `select-${label
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}`;

  const selectClassName = [
    "form-select",
    error ? "form-select--error" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={[
        "form-field",
        containerClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label && (
        <label
          className="form-label"
          htmlFor={generatedId}
        >
          {label}

          {required && (
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

      <select
        {...rest}
        id={generatedId}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={onChange}
        className={selectClassName}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error
            ? `${generatedId}-error`
            : helperText
              ? `${generatedId}-help`
              : undefined
        }
      >
        {placeholder && (
          <option
            value=""
            disabled={required}
          >
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p
          id={`${generatedId}-error`}
          className="form-field__error"
          role="alert"
        >
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          id={`${generatedId}-help`}
          className="form-field__help"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}