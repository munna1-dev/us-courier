import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getTracking } from "../lib/api";

import type {
  Shipment,
  TrackingEvent,
  TrackingResult,
} from "../types";

interface TrackingHookResult {
  trackingNumber: string;
  shipment: Shipment | null;
  history: TrackingEvent[];
  result: TrackingResult | null;
  loading: boolean;
  error: string;
  searched: boolean;
  setTrackingNumber: (
    value: string
  ) => void;
  track: (
    trackingNumber?: string
  ) => Promise<void>;
  refresh: () => Promise<void>;
  clearTracking: () => void;
  reset: () => void;
}

function normalizeResult(
  value: TrackingResult | null
): TrackingResult | null {
  if (!value) {
    return null;
  }

  return {
    shipment:
      value.shipment ?? null,
    events:
      Array.isArray(value.events)
        ? value.events
        : [],
  };
}

export function useTracking(
  initialTrackingNumber = ""
): TrackingHookResult {
  const [
    trackingNumber,
    setTrackingNumber,
  ] = useState(
    initialTrackingNumber
  );

  const [result, setResult] =
    useState<TrackingResult | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searched, setSearched] =
    useState(false);

  const track = useCallback(
    async (
      suppliedTrackingNumber?: string
    ) => {
      const value =
        (
          suppliedTrackingNumber ??
          trackingNumber
        ).trim();

      if (!value) {
        setError(
          "Enter a tracking number."
        );
        setSearched(true);
        setResult(null);
        return;
      }

      setTrackingNumber(value);
      setLoading(true);
      setError("");
      setSearched(true);

      try {
        const response =
          await getTracking(value);

        const normalized =
          normalizeResult(response);

        if (
          !normalized ||
          !normalized.shipment
        ) {
          setResult(null);
          setError(
            "No shipment was found for this tracking number."
          );
          return;
        }

        setResult(normalized);
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Unable to retrieve shipment tracking information.";

        setResult(null);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [trackingNumber]
  );

  const refresh =
    useCallback(async () => {
      if (!trackingNumber.trim()) {
        return;
      }

      await track(trackingNumber);
    }, [trackingNumber, track]);

  const clearTracking =
    useCallback(() => {
      setTrackingNumber("");
      setResult(null);
      setError("");
      setSearched(false);
      setLoading(false);
    }, []);

  const reset = clearTracking;

  useEffect(() => {
    const initial =
      initialTrackingNumber.trim();

    if (!initial) {
      return;
    }

    setTrackingNumber(initial);
  }, [initialTrackingNumber]);

  return {
    trackingNumber,
    shipment:
      result?.shipment ?? null,
    history:
      result?.events ?? [],
    result,
    loading,
    error,
    searched,
    setTrackingNumber,
    track,
    refresh,
    clearTracking,
    reset,
  };
}

export default useTracking;