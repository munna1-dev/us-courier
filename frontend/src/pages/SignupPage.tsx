import {
  FormEvent,
  useState,
} from "react";

import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

import {
  signUp,
} from "../lib/api";

export default function SignupPage() {
  const [
    firstName,
    setFirstName,
  ] = useState("");

  const [
    lastName,
    setLastName,
  ] = useState("");

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim()
    ) {
      setError(
        "Complete all required fields."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      await signUp(
        firstName,
        lastName,
        email,
        password
      );

      setSuccess(
        "Your account has been created. You can now sign in."
      );

      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create your account."
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
          Create your account
        </h1>

        <p className="muted">
          Create an account to
          manage your shipments.
        </p>

        {error && (
          <Alert
            variant="error"
            title="Registration failed"
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            variant="success"
            title="Account created"
          >
            {success}
          </Alert>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <Input
            label="First name"
            value={firstName}
            onChange={(event) =>
              setFirstName(
                event.target.value
              )
            }
            autoComplete="given-name"
            required
            disabled={loading}
          />

          <Input
            label="Last name"
            value={lastName}
            onChange={(event) =>
              setLastName(
                event.target.value
              )
            }
            autoComplete="family-name"
            required
            disabled={loading}
          />

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
            autoComplete="new-password"
            required
            disabled={loading}
          />

          <Input
            label="Confirm password"
            type="password"
            value={
              confirmPassword
            }
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
            autoComplete="new-password"
            required
            disabled={loading}
          />

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            Create account
          </Button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{" "}
          <a href="/login">
            Sign in
          </a>
        </p>
      </section>
    </main>
  );
}