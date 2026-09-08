import { Router } from "express";

import { requireSupabase } from "../lib/supabase.js";

const router = Router();

/*
 * GET /api/tracking/:trackingNumber
 */
router.get(
  "/:trackingNumber",
  async (req, res) => {
    const trackingNumber =
      String(
        req.params.trackingNumber || ""
      ).trim();

    if (!trackingNumber) {
      return res.status(400).json({
        message:
          "Tracking number is required.",
      });
    }

    try {
      const supabase =
        requireSupabase();

      const {
        data: shipment,
        error: shipmentError,
      } = await supabase
        .from("shipments")
        .select("*")
        .eq(
          "tracking_number",
          trackingNumber
        )
        .maybeSingle();

      if (shipmentError) {
        console.error(
          "Tracking shipment query failed:",
          shipmentError
        );

        return res.status(500).json({
          message:
            "Unable to retrieve shipment tracking information.",
        });
      }

      if (!shipment) {
        return res.status(404).json({
          message:
            "No shipment was found for this tracking number.",
        });
      }

      const {
        data: events,
        error: eventsError,
      } = await supabase
        .from("shipment_events")
        .select("*")
        .eq(
          "shipment_id",
          shipment.id
        )
        .order(
          "event_time",
          {
            ascending: false,
          }
        );

      if (eventsError) {
        console.error(
          "Tracking events query failed:",
          eventsError
        );

        return res.status(500).json({
          message:
            "Unable to retrieve shipment tracking history.",
        });
      }

      return res.status(200).json({
        shipment,
        events:
          events || [],
      });
    } catch (error) {
      console.error(
        "Tracking request failed:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve shipment tracking information.",
      });
    }
  }
);

export default router;
