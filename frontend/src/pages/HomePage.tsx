import TrackingForm from "../components/tracking/TrackingForm";

export default function HomePage() {
  function track(
    trackingNumber: string
  ) {
    const value =
      trackingNumber.trim();

    if (!value) {
      return;
    }

    window.history.pushState(
      {},
      "",
      `/tracking?tracking=${encodeURIComponent(
        value
      )}`
    );

    window.dispatchEvent(
      new PopStateEvent(
        "popstate"
      )
    );
  }

  return (
    <main>
      <section className="hero">
        <div className="page-shell hero__grid">
          <div className="hero__content">
            <p className="page-eyebrow">
              US Courier
            </p>

            <h1>
              Ship with confidence.
              Track every step.
            </h1>

            <p>
              Fast, transparent shipment
              tracking for customers,
              couriers, and delivery
              teams.
            </p>

            <div className="hero__actions">
              <a
                href="/tracking"
                className="button button--primary"
              >
                Track a shipment
              </a>

              <a
                href="/signup"
                className="button button--secondary"
              >
                Create account
              </a>
            </div>
          </div>

          <div className="hero__card">
            <h2>
              Track your package
            </h2>

            <p>
              Enter your tracking
              number to see the latest
              shipment status.
            </p>

            <TrackingForm
              onSubmit={track}
            />
          </div>
        </div>
      </section>

      <section className="feature-section">
        <div className="page-shell">
          <div className="section-heading">
            <p className="page-eyebrow">
              One platform
            </p>

            <h2>
              Everything you need to
              manage delivery.
            </h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <span>
                01
              </span>

              <h3>
                Real-time tracking
              </h3>

              <p>
                Follow shipment status
                and tracking events from
                pickup through delivery.
              </p>
            </article>

            <article className="feature-card">
              <span>
                02
              </span>

              <h3>
                Customer accounts
              </h3>

              <p>
                Customers can view their
                shipments and delivery
                history.
              </p>
            </article>

            <article className="feature-card">
              <span>
                03
              </span>

              <h3>
                Operations management
              </h3>

              <p>
                Administrators can manage
                shipments, facilities,
                couriers, and users.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}