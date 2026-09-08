import { useCallback, useState } from "react";

import Alert from "../common/Alert";
import Button from "../common/Button";
import Textarea from "../common/Textarea";

interface SupportCardProps {
  className?: string;
}

export default function SupportCard({
  className = "",
}: SupportCardProps) {
  const [message, setMessage] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const handleSubmit =
    useCallback(
      async (
        event: React.FormEvent<HTMLFormElement>,
      ) => {
        event.preventDefault();

        if (!message.trim()) {
          return;
        }

        setSubmitting(true);
        setSubmitted(false);

        /*
         * The support API can be connected here when
         * the backend support endpoint is finalized.
         * Keep the interaction local for now rather
         * than sending an unsupported request.
         */
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 300);
        });

        setSubmitting(false);
        setSubmitted(true);
        setMessage("");
      },
      [message],
    );

  const handleEmailSupport =
    useCallback(() => {
      window.location.href =
        "mailto:support@uscourier.app";
    }, []);

  return (
    <section
      className={`support-card ${
        className
          ? `support-card--${className}`
          : ""
      }`.trim()}
      aria-labelledby="support-title"
    >
      <div className="dashboard-section__header">
        <div>
          <h1 id="support-title">
            Support
          </h1>

          <p>
            Need help with a shipment or
            your Dispatch Courier account?
          </p>
        </div>
      </div>

      {submitted && (
        <Alert
          variant="success"
          title="Message received"
          dismissible
          onDismiss={() =>
            setSubmitted(false)
          }
        >
          Your support request has been
          recorded. A support representative
          can follow up with you.
        </Alert>
      )}

      <div className="support-card__grid">
        <div className="support-card__panel">
          <h2>
            Send a support request
          </h2>

          <p>
            Describe the issue you're
            experiencing and include your
            tracking number if your request
            concerns a shipment.
          </p>

          <form
            onSubmit={handleSubmit}
            className="support-card__form"
          >
            <Textarea
              label="Message"
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value,
                )
              }
              placeholder="How can we help?"
              rows={7}
              required
            />

            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={
                submitting ||
                !message.trim()
              }
            >
              Send request
            </Button>
          </form>
        </div>

        <aside className="support-card__panel">
          <h2>
            Contact support
          </h2>

          <p>
            For urgent account or shipment
            questions, contact our support
            team directly.
          </p>

          <Button
            type="button"
            variant="secondary"
            onClick={handleEmailSupport}
          >
            Email support
          </Button>

          <div className="support-card__contact">
            <span className="support-card__contact-label">
              Support email
            </span>

            <a
              href="mailto:support@uscourier.app"
              className="support-card__contact-link"
            >
              support@uscourier.app
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}