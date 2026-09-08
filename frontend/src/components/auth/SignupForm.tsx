import {
  FormEvent,
  useState,
} from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import Input from "../common/Input";

import { useAuth } from "../../hooks/useAuth";
import type { AuthResult } from "../../types";

interface LoginFormProps {
  initialEmail?: string;
  onSuccess?: (result: AuthResult) => void;
  onCreateAccount?: () => void;
  className?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.trim()
  );
}

function navigateToDashboard(): void {
  window.history.pushState(
    {},
    "",
    "/dashboard"
  );

  window.dispatchEvent(
    new PopStateEvent("popstate")
  );
}

export default function LoginForm({
  initialEmail = "",
  onSuccess,
  onCreateAccount,
  className = "",
}: LoginFormProps) {
  const {
    login,
    loading,
  } = useAuth();

  const [email, setEmail] =
    useState(initialEmail);

  const [password, setPassword] =
    useState("");

  const [emailError, setEmailError] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  function validate(): boolean {
    let valid = true;

    setEmailError("");
    setPasswordError("");
    setError("");

    const normalizedEmail =
      email.trim();

    if (!normalizedEmail) {
      setEmailError(
        "Email address is required."
      );
      valid = false;
    } else if (
      !isValidEmail(normalizedEmail)
    ) {
      setEmailError(
        "Enter a valid email address."
      );
      valid = false;
    }

    if (!password) {
      setPasswordError(
        "Password is required."
      );
      valid = false;
    }

    return valid;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    setSuccess("");
    setError("");

    if (!validate()) {
      return;
    }

    try {
      const result = await login({
        email: email.trim(),
        password,
      });

      if (!result) {
        throw new Error(
          "Unable to sign in. Please check your credentials and try again."
        );
      }

      setSuccess(
        "Sign in successful. Redirecting..."
      );

      if (onSuccess) {
        onSuccess(result);
        return;
      }

      navigateToDashboard();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please check your credentials and try again.";

      setError(message);
    }
  }

  const formClassName = [
    "auth-form",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form
      className={formClassName}
      onSubmit={handleSubmit}
      noValidate
    >
      {error && (
        <Alert
          variant="error"
          title="Sign in failed"
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          title="Success"
        >
          {success}
        </Alert>
      )}

      <Input
        label="Email address"
        name="email"
        type="email"
        value={email}
        placeholder="you@example.com"
        autoComplete="email"
        required
        requiredMark
        error={emailError}
        disabled={loading}
        onChange={(event) => {
          setEmail(event.target.value);

          if (emailError) {
            setEmailError("");
          }

          if (error) {
            setError("");
          }
        }}
      />

      <Input
        label="Password"
        name="password"
        type="password"
        value={password}
        placeholder="Enter your password"
        autoComplete="current-password"
        required
        requiredMark
        error={passwordError}
        disabled={loading}
        onChange={(event) => {
          setPassword(event.target.value);

          if (passwordError) {
            setPasswordError("");
          }

          if (error) {
            setError("");
          }
        }}
      />

      <div className="auth-form__actions">
        <Button
          type="submit"
          variant="primary"
          size="large"
          loading={loading}
          disabled={loading}
          className="auth-form__submit"
        >
          Sign in
        </Button>
      </div>

      <div className="auth-form__footer">
        <span>
          Don't have an account?
        </span>

        <button
          type="button"
          className="auth-form__link"
          onClick={() => {
            if (onCreateAccount) {
              onCreateAccount();
              return;
            }

            window.history.pushState(
              {},
              "",
              "/signup"
            );

            window.dispatchEvent(
              new PopStateEvent("popstate")
            );
          }}
          disabled={loading}
        >
          Create an account
        </button>
      </div>
    </form>
  );
}