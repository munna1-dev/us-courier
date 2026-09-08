import {
  useEffect,
  useState,
} from "react";

import TrackingForm from "../components/tracking/TrackingForm";
import TrackingStatus from "../components/tracking/TrackingStatus";
import TrackingTimeline from "../components/tracking/TrackingTimeline";

import {
  useTracking,
} from "../hooks/useTracking";

interface TrackingPageProps {
  initialTrackingNumber?: string;
}

export default function TrackingPage({
  initialTrackingNumber = "",
}: TrackingPageProps) {
  const [
    trackingNumber,
    setTrackingNumber,
  ] = useState(
    initialTrackingNumber
  );

  const {
    result,
    loading,
    error,
    track,
  } = useTracking();

  useEffect(() => {
    const value =
      initialTrackingNumber.trim();

    if (!value) {
      return;
    }

    setTrackingNumber(value);

    void track(value);
  }, [
    initialTrackingNumber,
    track,
  ]);

  function handleSubmit(
    value: string
  ) {
    const normalized =
      value.trim();

    setTrackingNumber(
      normalized
    );

    if (!normalized) {
      return;
    }

    void track(normalized);

    const nextUrl =
      `/tracking?tracking=${encodeURIComponent(
        normalized
      )}`;

    window.history.replaceState(
      {},
      "",
      nextUrl
    );
  }

  return (
    <main className="tracking-page">
      <section className="tracking-page__hero">
        <div className="page-shell">
          <div className="tracking-page__intro">
            <p className="page-eyebrow">
              US Courier
            </p>

            <h1>
              Track your shipment
            </h1>

            <p>
              Enter your tracking
              number to see the latest
              shipment status and
              tracking history.
            </p>
          </div>

          <TrackingForm
            initialValue={
              trackingNumber
            }
            onSubmit={
              handleSubmit
            }
            loading={loading}
          />
        </div>
      </section>

      <section className="tracking-page__results">
        <div className="page-shell">
          {loading && (
            <div className="tracking-card tracking-card--loading">
              <div className="loading-spinner" />

              <h2>
                Finding your shipment...
              </h2>

              <p>
                Please wait while we
                retrieve the latest
                tracking information.
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="tracking-card tracking-card--error">
              <h2>
                Shipment not found
              </h2>

              <p>
                {error}
              </p>

              {trackingNumber && (
                <p>
                  Check that{" "}
                  <strong>
                    {trackingNumber}
                  </strong>{" "}
                  is correct and try
                  again.
                </p>
              )}
            </div>
          )}

          {!loading &&
            !error &&
            result && (
              <div className="tracking-results">
                <TrackingStatus
                  result={result}
                />

                <TrackingTimeline
                  events={
                    result.events
                  }
                />
              </div>
            )}

          {!loading &&
            !error &&
            !result && (
              <div className="tracking-card tracking-card--empty">
                <h2>
                  Track a shipment
                </h2>

                <p>
                  Enter a US Courier
                  tracking number above
                  to view its current
                  status.
                </p>
              </div>
            )}
        </div>
      </section>
    </main>
  );
}