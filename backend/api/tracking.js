import { Router } from "express";
import { requireSupabase } from "../lib/supabase.js";

const router = Router();

const SHIPMENT_FIELDS = [
  "id",
  "tracking_number",
  "origin",
  "destination",
  "service_type",
  "status",
  "current_location",
  "estimated_delivery_date",
  "description",
  "weight",
  "package_count",
  "created_at",
  "updated_at",
].join(",");

const EVENT_FIELDS = [
  "status",
  "location",
  "description",
  "event_time",
  "created_at",
].join(",");

router.get("/:trackingNumber", async (req, res) => {
  const trackingNumber = String(
    req.params.trackingNumber || ""
  ).trim();

  if (!trackingNumber) {
    return res.status(400).json({
      message: "Tracking number is required.",
    });
  }

  try {
    const supabase = requireSupabase();

    const { data: shipment, error: shipmentError } =
      await supabase
        .from("shipments")
        .select(SHIPMENT_FIELDS)
        .eq("tracking_number", trackingNumber)
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

    const { data: events, error: eventsError } =
      await supabase
        .from("shipment_events")
        .select(EVENT_FIELDS)
        .eq("shipment_id", shipment.id)
        .order("event_time", {
          ascending: false,
        });

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

    const publicShipment = {
      tracking_number: shipment.tracking_number,
      origin: shipment.origin,
      destination: shipment.destination,
      service_type: shipment.service_type,
      status: shipment.status,
      current_location: shipment.current_location,
      estimated_delivery: shipment.estimated_delivery_date,
      description: shipment.description,
      weight_kg: shipment.weight,
      package_count: shipment.package_count,
      created_at: shipment.created_at,
      updated_at: shipment.updated_at,
    };

    const publicEvents = (events || []).map((event) => ({
      status: event.status,
      location: event.location,
      description: event.description,
      event_time: event.event_time,
      created_at: event.created_at,
    }));

    return res.status(200).json({
      shipment: publicShipment,
      events: publicEvents,
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
});

export default router;
