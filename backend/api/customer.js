import { Router } from "express";

import {
  requireAuth,
} from "../auth/auth.js";

import {
  requireSupabase,
} from "../lib/supabase.js";

const router = Router();

function mapShipment(shipment) {
  return {
    id: shipment.id,

    trackingNumber:
      shipment.tracking_number,

    referenceNumber:
      shipment.reference_number || null,

    status:
      shipment.status,

    serviceType:
      shipment.service_type,

    packageType:
      shipment.package_type,

    description:
      shipment.description || null,

    weight:
      shipment.weight ?? null,

    weightUnit:
      shipment.weight_unit || "kg",

    senderName:
      shipment.sender_name,

    recipientName:
      shipment.recipient_name,

    currentLocation:
      shipment.current_location ||
      null,

    estimatedDeliveryDate:
      shipment.estimated_delivery_date ||
      null,

    actualDeliveryDate:
      shipment.actual_delivery_date ||
      null,

    deliveredAt:
      shipment.delivered_at ||
      null,

    createdAt:
      shipment.created_at,

    updatedAt:
      shipment.updated_at,
  };
}

/*
 * GET /api/customer/dashboard
 */
router.get(
  "/dashboard",
  requireAuth,
  async (req, res) => {
    try {
      const supabase =
        requireSupabase();

      const {
        data: shipments,
        error,
      } =
        await supabase
          .from("shipments")
          .select("*")
          .eq(
            "customer_id",
            req.auth.user.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (error) {
        console.error(
          "Customer dashboard query failed:",
          error
        );

        return res.status(500).json({
          message:
            "Unable to load customer dashboard.",
        });
      }

      const records =
        shipments || [];

      const summary = {
        total:
          records.length,

        pending:
          records.filter(
            (shipment) =>
              shipment.status ===
              "pending"
          ).length,

        pickedUp:
          records.filter(
            (shipment) =>
              shipment.status ===
              "picked_up"
          ).length,

        inTransit:
          records.filter(
            (shipment) =>
              shipment.status ===
              "in_transit"
          ).length,

        outForDelivery:
          records.filter(
            (shipment) =>
              shipment.status ===
              "out_for_delivery"
          ).length,

        delivered:
          records.filter(
            (shipment) =>
              shipment.status ===
              "delivered"
          ).length,

        exceptions:
          records.filter(
            (shipment) =>
              shipment.status ===
              "exception"
          ).length,
      };

      return res.status(200).json({
        user: {
          id:
            req.auth.user.id,

          email:
            req.auth.user.email,

          firstName:
            req.auth.profile
              ?.first_name ||
            "",

          lastName:
            req.auth.profile
              ?.last_name ||
            "",

          role:
            req.auth.profile
              ?.role ||
            "customer",

          status:
            req.auth.profile
              ?.status ||
            "active",
        },

        summary,

        shipments:
          records.map(
            mapShipment
          ),
      });
    } catch (error) {
      console.error(
        "Customer dashboard error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load customer dashboard.",
      });
    }
  }
);

/*
 * GET /api/customer/shipments
 */
router.get(
  "/shipments",
  requireAuth,
  async (req, res) => {
    try {
      const supabase =
        requireSupabase();

      const {
        data,
        error,
      } =
        await supabase
          .from("shipments")
          .select("*")
          .eq(
            "customer_id",
            req.auth.user.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (error) {
        console.error(
          "Customer shipments query failed:",
          error
        );

        return res.status(500).json({
          message:
            "Unable to retrieve shipments.",
        });
      }

      return res.status(200).json({
        shipments:
          (data || []).map(
            mapShipment
          ),
      });
    } catch (error) {
      console.error(
        "Customer shipments error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve shipments.",
      });
    }
  }
);

/*
 * GET /api/customer/shipments/:id
 */
router.get(
  "/shipments/:id",
  requireAuth,
  async (req, res) => {
    const shipmentId =
      String(
        req.params.id || ""
      ).trim();

    if (!shipmentId) {
      return res.status(400).json({
        message:
          "Shipment ID is required.",
      });
    }

    try {
      const supabase =
        requireSupabase();

      const {
        data: shipment,
        error,
      } =
        await supabase
          .from("shipments")
          .select("*")
          .eq(
            "id",
            shipmentId
          )
          .eq(
            "customer_id",
            req.auth.user.id
          )
          .maybeSingle();

      if (error) {
        return res.status(500).json({
          message:
            "Unable to retrieve shipment.",
        });
      }

      if (!shipment) {
        return res.status(404).json({
          message:
            "Shipment not found.",
        });
      }

      const {
        data: events,
        error:
          eventsError,
      } =
        await supabase
          .from("shipment_events")
          .select(
            `
              id,
              shipment_id,
              status,
              title,
              description,
              location,
              event_time,
              created_at
            `
          )
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
        return res.status(500).json({
          message:
            "Unable to retrieve shipment history.",
        });
      }

      return res.status(200).json({
        shipment:
          mapShipment(
            shipment
          ),

        events:
          events || [],
      });
    } catch (error) {
      console.error(
        "Customer shipment error:",
        error
      );

      return res.status(