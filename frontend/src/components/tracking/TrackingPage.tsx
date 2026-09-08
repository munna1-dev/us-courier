import {
  useCallback,
  useEffect,
} from "react";

import PublicHeader from "../layout/PublicHeader";
import PublicFooter from "../layout/PublicFooter";
import Alert from "../common/Alert";
import EmptyState from "../common/EmptyState";
import LoadingScreen from "../common/LoadingScreen";
import TrackingForm from "./TrackingForm";
import TrackingResult from "./TrackingResult";

import { useTracking } from "../../hooks/useTracking";

interface TrackingPageProps {
  initialTrackingNumber?: string;
}

export default function TrackingPage({
  initialTrackingNumber,
}: TrackingPageProps) {
  const {
    trackingNumber,
    shipment,
    history,
    loading,
    error,
    searched,
    track,
    clearTracking,
    refresh,
  } = useTracking(
    initialTrackingNumber,
  );

  useEffect(() => {
    document.title =
      trackingNumber.trim()
        ? `Track ${trackingNumber
            .trim()
            .toUpperCase()} — Dispatch Courier`
        : "Track a Shipment — Dispatch Courier";
  }, [trackingNumber]);

  const handleSubmit =
    useCallback(
      async (
        value: string,
      ) => {
        const normalized =
          value.trim();

        if (!normalized) {
          return;
        }

        await track(normalized);
      },
      [track],
    );

  const handleNewSearch =
    useCallback(() => {
      clearTracking();

      const currentPath =
        window.location.pathname;

      if (currentPath !== "/track") {
        window.history.replaceState(
          {},
          "",
          "/track",
        );

        window.dispatchEvent(
          new PopStateEvent(
            "popstate",
          ),
        );
      }
    }, [clearTracking]);

  const handleRefresh =
    useCallback(async () => {
      await refresh();
    }, [refresh]);

  return (
    <div className="app-page tracking-page-shell">
      <PublicHeader />

      <main className="tracking-page">
        <section className="content-section">
          <div className="page-shell">
            <div className="page-heading">
              <h1>
                Track a Shipment
              </h1>

              <p>
                Enter your tracking number
                to view the latest shipment
                status, location, and
                delivery history.
              </p>
            </div>

            <div className="tracking-search-card">
              <TrackingForm
                initialValue={
                  initialTrackingNumber ??
                  ""
                }
                loading={loading}
                onSubmit={
                  handleSubmit
                }
              />
            </div>

            {loading && (
              <div className="tracking-loading">
                <LoadingScreen
                  message="Looking up your shipment..."
                  fullScreen={false}
                />
              </div>
            )}

            {!loading && error && (
              <div className="tracking-error">
                <Alert
                  variant="error"
                  title="Tracking unavailable"
                >
                  {error}
                </Alert>
              </div>
            )}

            {!loading &&
              !error &&
              shipment && (
                <div className="tracking-result">
                  <TrackingResult
                    shipment={shipment}
                    history={history}
                    onRefresh={
                      handleRefresh
                    }
                    onNewSearch={
                      handleNewSearch
                    }
                    loading={loading}
                  />
                </div>
              )}

            {!loading &&
              !error &&
              searched &&
              !shipment && (
                <div className="tracking-empty-state">
                  <EmptyState
                    title="Shipment not found"
                    description="We couldn't find a shipment matching that tracking number. Check the number and try again."
                  />
                </div>
              )}

            {!loading &&
              !error &&
              !searched &&
              !shipment && (
                <div className="tracking-placeholder">
                  <EmptyState
                    title="Enter a tracking number"
                    description="Your shipment status and tracking history will appear here after you search."
                  />
                </div>
              )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}