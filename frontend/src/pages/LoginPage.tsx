import {
  FormEvent,
  useState,
} from "react";

import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

import {
  signIn,
} from "../lib/api";

import {
  getDashboardPath,
  setStoredUser,
} from "../lib/auth";

export default function LoginPage() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (
      !email.trim() ||
      !password
    ) {
      setError(
        "Enter your email and password."
      );
      return;
    }

    setLoading(true);

    try {
      const user =
        await signIn(
          email,
          password
        );

      setStoredUser(user);

      window.location.href =
        getDashboardPath(user);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="page-eyebrow">
          US Courier
        </p>

        <h1>
          Welcome back
        </h1>

        <p className="muted">
          Sign in to manage your
          shipments and account.
        </p>

        {error && (
          <Alert
            variant="error"
            title="Sign in failed"
          >
            {error}
          </Alert>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            autoComplete="email"
            required
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            autoComplete="current-password"
            required
            disabled={loading}
          />

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            Sign in
          </Button>
        </form>

        <p className="auth-card__footer">
          Don't have an account?{" "}
          <a href="/signup">
            Create one
          </a>
        </p>
      </section>
    </main>
  );
}