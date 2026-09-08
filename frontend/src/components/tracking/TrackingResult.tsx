/* =========================================================
   Dispatch Courier
   Tracking Result
   ========================================================= */

import Button from "../common/Button";

import ShipmentSummary from "./ShipmentSummary";

import TrackingTimeline from "./TrackingTimeline";

import type {
  Shipment,
  TrackingEvent,
} from "../../types";


/* =========================================================
   Props
   ========================================================= */

export interface TrackingResultProps {
  shipment: Shipment;

  history: TrackingEvent[];

  loading?: boolean;

  onRefresh?: () => void | Promise<void>;

  onNewSearch?: () => void;

  className?: string;
}


/* =========================================================
   Component
   ========================================================= */

export default function TrackingResult({
  shipment,

  history,

  loading = false,

  onRefresh,

  onNewSearch,

  className = "",
}: TrackingResultProps) {
  const classes = [
    "tracking-result",

    className,
  ]
    .filter(Boolean)
    .join(" ");


  return (
    <section
      className={classes}
      aria-label="Shipment tracking result"
    >
      {/* ---------------------------------------------------
          Result Header
          --------------------------------------------------- */}

      <header className="tracking-result__header">
        <div>
          <span className="tracking-result__eyebrow">
            Tracking result
          </span>

          <h1>
            Shipment details
          </h1>

          <p>
            Latest available information
            for{" "}
            <strong>
              {shipment.tracking_number}
            </strong>
          </p>
        </div>


        {/* -------------------------------------------------
            Actions
            ------------------------------------------------- */}

        <div className="tracking-result__actions">
          {onNewSearch && (
            <Button
              variant="secondary"
              size="medium"
              onClick={
                onNewSearch
              }
              disabled={
                loading
              }
            >
              New search
            </Button>
          )}

          {onRefresh && (
            <Button
              variant="primary"
              size="medium"
              loading={loading}
              onClick={
                onRefresh
              }
            >
              Refresh
            </Button>
          )}
        </div>
      </header>


      {/* ---------------------------------------------------
          Shipment Summary
          --------------------------------------------------- */}

      <div className="tracking-result__summary">
        <ShipmentSummary
          shipment={
            shipment
          }
        />
      </div>


      {/* ---------------------------------------------------
          Tracking Timeline
          --------------------------------------------------- */}

      <div className="tracking-result__timeline">
        <TrackingTimeline
          events={
            history
          }
        />
      </div>


      {/* ---------------------------------------------------
          Footer Note
          --------------------------------------------------- */}

      <div className="tracking-result__note">
        <span
          className="tracking-result__note-icon"
          aria-hidden="true"
        >
          ℹ
        </span>

        <p>
          Tracking information is based on
          the latest shipment update available
          in the Dispatch Courier system.
        </p>
      </div>
    </section>
  );
}