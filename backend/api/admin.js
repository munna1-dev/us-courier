import { Router } from "express";

import {
  requireAdmin,
  requirePermission,
  hasPermission,
} from "../auth/auth.js";

import {
  requireSupabase,
} from "../lib/supabase.js";

const router = Router();

router.use(
  requireAdmin
);

function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function nullableString(value) {
  const cleaned =
    cleanString(value);

  return cleaned || null;
}

/*
 * GET /api/admin/me
 */
router.get(
  "/me",
  async (req, res) => {
    return res.status(200).json({
      authenticated: true,
      authorized: true,

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
          "admin",

        status:
          req.auth.profile
            ?.status ||
          "active",
      },
    });
  }
);

/*
 * GET /api/admin/dashboard
 */
router.get(
  "/dashboard",
  requirePermission("report.read"),
  async (_req, res) => {
    try {
      const supabase =
        requireSupabase();

      const [
        usersResult,
        shipmentsResult,
        couriersResult,
        facilitiesResult,
      ] = await Promise.all([
        supabase
          .from("users")
          .select(
            "id,role,status",
            {
              count: "exact",
              head: false,
            }
          ),

        supabase
          .from("shipments")
          .select(
            "id,status",
            {
              count: "exact",
              head: false,
            }
          ),

        supabase
          .from("couriers")
          .select(
            "id,status",
            {
              count: "exact",
              head: false,
            }
          ),

        supabase
          .from("facilities")
          .select(
            "id,active",
            {
              count: "exact",
              head: false,
            }
          ),
      ]);

      if (
        usersResult.error ||
        shipmentsResult.error ||
        couriersResult.error ||
        facilitiesResult.error
      ) {
        console.error(
          "Admin dashboard query failed:",
          {
            users:
              usersResult.error,
            shipments:
              shipmentsResult.error,
            couriers:
              couriersResult.error,
            facilities:
              facilitiesResult.error,
          }
        );

        return res.status(500).json({
          message:
            "Unable to load admin dashboard.",
        });
      }

      const users =
        usersResult.data || [];

      const shipments =
        shipmentsResult.data || [];

      const couriers =
        couriersResult.data || [];

      const facilities =
        facilitiesResult.data || [];

      return res.status(200).json({
        summary: {
          totalUsers:
            users.length,

          customers:
            users.filter(
              (user) =>
                user.role ===
                "customer"
            ).length,

          admins:
            users.filter(
              (user) =>
                user.role ===
                "admin"
            ).length,

          totalShipments:
            shipments.length,

          pendingShipments:
            shipments.filter(
              (shipment) =>
                shipment.status ===
                "pending"
            ).length,

          inTransitShipments:
            shipments.filter(
              (shipment) =>
                shipment.status ===
                "in_transit"
            ).length,

          deliveredShipments:
            shipments.filter(
              (shipment) =>
                shipment.status ===
                "delivered"
            ).length,

          totalCouriers:
            couriers.length,

          activeCouriers:
            couriers.filter(
              (courier) =>
                courier.status ===
                "active"
            ).length,

          totalFacilities:
            facilities.length,

          activeFacilities:
            facilities.filter(
              (facility) =>
                facility.active
            ).length,
        },
      });
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load admin dashboard.",
      });
    }
  }
);

/*
 * GET /api/admin/users
 */
router.get(
  "/users",
  requirePermission("user.read"),
  async (req, res) => {
    try {
      const supabase =
        requireSupabase();

      let query =
        supabase
          .from("users")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      const search =
        cleanString(
          req.query.search
        );

      const role =
        cleanString(
          req.query.role
        );

      const status =
        cleanString(
          req.query.status
        );

      if (search) {
        const escaped =
          search.replace(
            /[%_]/g,
            (character) =>
              `\\${character}`
          );

        query =
          query.or(
            `email.ilike.%${escaped}%,first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%`
          );
      }

      if (role) {
        query =
          query.eq(
            "role",
            role
          );
      }

      if (status) {
        query =
          query.eq(
            "status",
            status
          );
      }

      const {
        data,
        error,
      } =
        await query;

      if (error) {
        console.error(
          "Admin users query failed:",
          error
        );

        return res.status(500).json({
          message:
            "Unable to retrieve users.",
        });
      }

      return res.status(200).json({
        users:
          data || [],
      });
    } catch (error) {
      console.error(
        "Admin users error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve users.",
      });
    }
  }
);

/*
 * GET /api/admin/users/:id
 */
router.get(
  "/users/:id",
  requirePermission("user.read"),
  async (req, res) => {
    try {
      const supabase =
        requireSupabase();

      const {
        data,
        error,
      } =
        await supabase
          .from("users")
          .select("*")
          .eq(
            "id",
            req.params.id
          )
          .maybeSingle();

      if (error) {
        return res.status(500).json({
          message:
            "Unable to retrieve user.",
        });
      }

      if (!data) {
        return res.status(404).json({
          message:
            "User not found.",
        });
      }

      return res.status(200).json({
        user: data,
      });
    } catch (error) {
      console.error(
        "Admin user lookup failed:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve user.",
      });
    }
  }
);

/*
 * PUT /api/admin/users/:id
 */
router.put(
  "/users/:id",
  requirePermission("user.update"),
  async (req, res) => {
    const userId =
      cleanString(
        req.params.id
      );

    if (!userId) {
      return res.status(400).json({
        message:
          "User ID is required.",
      });
    }

    try {
      const supabase =
        requireSupabase();

      const updates = {};

      if (
        req.body.firstName !==
        undefined
      ) {
        updates.first_name =
          cleanString(
            req.body.firstName
          );
      }

      if (
        req.body.lastName !==
        undefined
      ) {
        updates.last_name =
          cleanString(
            req.body.lastName
          );
      }

      if (
        req.body.email !==
        undefined
      ) {
        updates.email =
          cleanString(
            req.body.email
          ).toLowerCase();
      }

      if (
        req.body.phone !==
        undefined
      ) {
        updates.phone =
          nullableString(
            req.body.phone
          );
      }

      if (
        req.body.role !==
        undefined
      ) {
        if (
          !hasPermission(
            req.auth.role,
            "role.assign"
          )
        ) {
          return res.status(403).json({
            message:
              "You do not have permission to assign user roles.",
          });
        }

        const requestedRole =
          cleanString(
            req.body.role
          ).toLowerCase();

        const allowedRoles = [
          "customer",
          "super_admin",
          "admin",
          "manager",
          "courier",
          "support",
          "viewer",
        ];

        if (
          !allowedRoles.includes(
            requestedRole
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid user role.",
          });
        }

        if (
          requestedRole ===
            "super_admin" &&
          !req.auth.isSuperAdmin
        ) {
          return res.status(403).json({
            message:
              "Only the Super Admin can assign the Super Admin role.",
          });
        }

        updates.role =
          requestedRole;
      }

      if (
        req.body.status !==
        undefined
      ) {
        updates.status =
          cleanString(
            req.body.status
          );
      }

      updates.updated_at =
        new Date().toISOString();

      const {
        data,
        error,
      } =
        await supabase
          .from("users")
          .update(updates)
          .eq(
            "id",
            userId
          )
          .select("*")
          .maybeSingle();

      if (error) {
        console.error(
          "Admin user update failed:",
          error
        );

        return res.status(400).json({
          message:
            error.message ||
            "Unable to update user.",
        });
      }

      if (!data) {
        return res.status(404).json({
          message:
            "User not found.",
        });
      }

      await supabase
        .from("audit_logs")
        .insert({
          actor_id:
            req.auth.user.id,

          action:
            "update_user",

          entity_type:
            "user",

          entity_id:
            userId,

          description:
            `Administrator updated user ${userId}.`,

          metadata:
            {
              changes:
                updates,
            },
        });

      return res.status(200).json({
        user: data,
      });
    } catch (error) {
      console.error(
        "Admin user update error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to update user.",
      });
    }
  }
);

/*
 * DELETE /api/admin/users/:id
 */
router.delete(
  "/users/:id",
  requirePermission("user.delete"),
  async (req, res) => {
    const userId =
      cleanString(
        req.params.id
      );

    if (
      userId ===
      req.auth.user.id
    ) {
      return res.status(400).json({
        message:
          "You cannot delete your own administrator account.",
      });
    }

    try {
      const supabase =
        requireSupabase();

      const {
        error:
          profileError,
      } =
        await supabase
          .from("users")
          .delete()
          .eq(
            "id",
            userId
          );

      if (profileError) {
        console.error(
          "User deletion failed:",
          profileError
        );

        return res.status(400).json({
          message:
            profileError.message ||
            "Unable to delete user.",
        });
      }

      await supabase
        .from("audit_logs")
        .insert({
          actor_id:
            req.auth.user.id,

          action:
            "delete_user",

          entity_type:
            "user",

          entity_id:
            userId,

          description:
            `Administrator deleted user ${userId}.`,
        });

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error(
        "Admin user deletion error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to delete user.",
      });
    }
  }
);

/*
 * GET /api/admin/couriers
 */
router.get(
  "/couriers",
  requirePermission("operations.manage"),
  async (_req, res) => {
    try {
      const supabase =
        requireSupabase();

      const {
        data,
        error,
      } =
        await supabase
          .from("couriers")
          .select(
            `
              *,
              current_facility:facilities(
                id,
                name,
                code,
                city,
                state
              )
            `
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (error) {
        return res.status(500).json({
          message:
            "Unable to retrieve couriers.",
        });
      }

      return res.status(200).json({
        couriers:
          data || [],
      });
    } catch (error) {
      console.error(
        "Admin couriers error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve couriers.",
      });
    }
  }
);

/*
 * POST /api/admin/couriers
 */
router.post(
  "/couriers",
  requirePermission("operations.manage"),
  async (req, res) => {
    const firstName =
      cleanString(
        req.body?.firstName
      );

    const lastName =
      cleanString(
        req.body?.lastName
      );

    if (
      !firstName ||
      !lastName
    ) {
      return res.status(400).json({
        message:
          "First name and last name are required.",
      });
    }

    try {
      const supabase =
        requireSupabase();

      const {
        data,
        error,
      } =
        await supabase
          .from("couriers")
          .insert({
            employee_number:
              nullableString(
                req.body
                  ?.employeeNumber
              ),

            first_name:
              firstName,

            last_name:
              lastName,

            email:
              nullableString(
                req.body?.email
              ),

            phone:
              nullableString(
                req.body?.phone
              ),

            status:
              cleanString(
                req.body?.status
              ) ||
              "active",

            vehicle_number:
              nullableString(
                req.body
                  ?.vehicleNumber
              ),

            license_number:
              nullableString(
                req.body
                  ?.licenseNumber
              ),

            current_facility_id:
              nullableString(
                req.body
                  ?.currentFacilityId
              ),
          })
          .select("*")
          .single();

      if (error) {
        return res.status(400).json({
          message:
            error.message ||
            "Unable to create courier.",
        });
      }

      await supabase
        .from("audit_logs")
        .insert({
          actor_id:
            req.auth.user.id,

          action:
            "create_courier",

          entity_type:
            "courier",

          entity_id:
            data.id,

          description:
            `Administrator created courier ${data.id}.`,
        });

      return res.status(201).json({
        courier: data,
      });
    } catch (error) {
      console.error(
        "Create courier error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to create courier.",
      });
    }
  }
);

/*
 * DELETE /api/admin/couriers/:id
 */
router.delete(
  "/couriers/:id",
  requirePermission("operations.manage"),
  async (req, res) => {
    try {
      const supabase =
        requireSupabase();

      const {
        error,
      } =
        await supabase
          .from("couriers")
          .delete()
          .eq(
            "id",
            req.params.id
          );

      if (error) {
        return res.status(400).json({
          message:
            error.message ||
            "Unable to delete courier.",
        });
      }

      await supabase
        .from("audit_logs")
        .insert({
          actor_id:
            req.auth.user.id,

          action:
            "delete_courier",

          entity_type:
            "courier",

          entity_id:
            req.params.id,

          description:
            `Administrator deleted courier ${req.params.id}.`,
        });

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error(
        "Delete courier error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to delete courier.",
      });
    }
  }
);

/*
 * GET /api/admin/facilities
 */
router.get(
  "/facilities",
  requirePermission("operations.manage"),
  async (_req, res) => {
    try {
      const supabase =
        requireSupabase();

      const {
        data,
        error,
      } =
        await supabase
          .from("facilities")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (error) {
        return res.status(500).json({
          message:
            "Unable to retrieve facilities.",
        });
      }

      return res.status(200).json({
        facilities:
          data || [],
      });
    } catch (error) {
      console.error(
        "Admin facilities error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve facilities.",
      });
    }
  }
);

/*
 * POST /api/admin/facilities
 */
router.post(
  "/facilities",
  requirePermission("operations.manage"),
  async (req, res) => {
    const name =
      cleanString(
        req.body?.name
      );

    const code =
      cleanString(
        req.body?.code
      ).toUpperCase();

    if (!name || !code) {
      return res.status(400).json({
        message:
          "Facility name and code are required.",
      });
    }

    try {
      const supabase =
        requireSupabase();

      const {
        data,
        error,
      } =
        await supabase
          .from("facilities")
          .insert({
            name,

            code,

            facility_type:
              cleanString(
                req.body
                  ?.facilityType
              ) ||
              "station",

            address:
              nullableString(
                req.body?.address
              ),

            city:
              nullableString(
                req.body?.city
              ),

            state:
              nullableString(
                req.body?.state
              ),

            postal_code:
              nullableString(
                req.body
                  ?.postalCode
              ),

            country:
              cleanString(
                req.body?.country
              ) ||
              "United States",

            phone:
              nullableString(
                req.body?.phone
              ),

            email:
              nullableString(
                req.body?.email
              ),

            latitude:
              req.body?.latitude ??
              null,

            longitude:
              req.body?.longitude ??
              null,

            active:
              req.body?.active !==
              false,
          })
          .select("*")
          .single();

      if (error) {
        return res.status(400).json({
          message:
            error.message ||
            "Unable to create facility.",
        });
      }

      await supabase
        .from("audit_logs")
        .insert({
          actor_id:
            req.auth.user.id,

          action:
            "create_facility",

          entity_type:
            "facility",

          entity_id:
            data.id,

          description:
            `Administrator created facility ${data.code}.`,
        });

      return res.status(201).json({
        facility: data,
      });
    } catch (error) {
      console.error(
        "Create facility error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to create facility.",
      });
    }
  }
);

/*
 * DELETE /api/admin/facilities/:id
 */
router.delete(
  "/facilities/:id",
  requirePermission("operations.manage"),
  async (req, res) => {
    try {
      const supabase =
        requireSupabase();

      const {
        error,
      } =
        await supabase
          .from("facilities")
          .delete()
          .eq(
            "id",
            req.params.id
          );

      if (error) {
        return res.status(400).json({
          message:
            error.message ||
            "Unable to delete facility.",
        });
      }

      await supabase
        .from("audit_logs")
        .insert({
          actor_id:
            req.auth.user.id,

          action:
            "delete_facility",

          entity_type:
            "facility",

          entity_id:
            req.params.id,

          description:
            `Administrator deleted facility ${req.params.id}.`,
        });

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error(
        "Delete facility error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to delete facility.",
      });
    }
  }
);

/*
 * GET /api/admin/shipments
 */
router.get(
  "/shipments",
  requirePermission("shipment.read"),
  async (req, res) => {
    try {
      const supabase =
        requireSupabase();

      let query =
        supabase
          .from("shipments")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      const search =
        cleanString(
          req.query.search
        );

      const status =
        cleanString(
          req.query.status
        );

      if (search) {
        query =
          query.or(
            `tracking_number.ilike.%${search}%,reference_number.ilike.%${search}%,recipient_name.ilike.%${search}%,sender_name.ilike.%${search}%`
          );
      }

      if (status) {
        query =
          query.eq(
            "status",
            status
          );
      }

      const {
        data,
        error,
      } =
        await query;

      if (error) {
        console.error(
          "Admin shipments query failed:",
          error
        );

        return res.status(500).json({
          message:
            "Unable to retrieve shipments.",
        });
      }

      return res.status(200).json({
        shipments:
          data || [],
      });
    } catch (error) {
      console.error(
        "Admin shipments error:",
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
 * POST /api/admin/shipments
 */
router.post(
  "/shipments",
  requirePermission("shipment.create"),
  async (req, res) => {
    const senderName =
      cleanString(
        req.body?.senderName
      );

    const recipientName =
      cleanString(
        req.body?.recipientName
      );

    if (
      !senderName ||
      !recipientName
    ) {
      return res.status(400).json({
        message:
          "Sender name and recipient name are required.",
      });
    }

    try {
      const supabase =
        requireSupabase();

      let trackingNumber =
        cleanString(
          req.body
            ?.trackingNumber
        ).toUpperCase();

      if (!trackingNumber) {
        const {
          data:
            generated,
          error:
            generationError,
        } =
          await supabase.rpc(
            "generate_tracking_number"
          );

        if (generationError) {
          return res.status(500).json({
            message:
              "Unable to generate tracking number.",
          });
        }

        trackingNumber =
          generated;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("shipments")
          .insert({
            tracking_number:
              trackingNumber,

            reference_number:
              nullableString(
                req.body
                  ?.referenceNumber
              ),

            customer_id:
              nullableString(
                req.body
                  ?.customerId
              ),

            sender_name:
              senderName,

            sender_email:
              nullableString(
                req.body
                  ?.senderEmail
              ),

            sender_phone:
              nullableString(
                req.body
                  ?.senderPhone
              ),

            sender_address_id:
              nullableString(
                req.body
                  ?.senderAddressId
              ),

            recipient_name:
              recipientName,

            recipient_email:
              nullableString(
                req.body
                  ?.recipientEmail
              ),

            recipient_phone:
              nullableString(
                req.body
                  ?.recipientPhone
              ),

            recipient_address_id:
              nullableString(
                req.body
                  ?.recipientAddressId
              ),

            origin_facility_id:
              nullableString(
                req.body
                  ?.originFacilityId
              ),

            destination_facility_id:
              nullableString(
                req.body
                  ?.destinationFacilityId
              ),

            assigned_courier_id:
              nullableString(
                req.body
                  ?.assignedCourierId
              ),

            service_type:
              cleanString(
                req.body
                  ?.serviceType
              ) ||
              "standard",

            package_type:
              cleanString(
                req.body
                  ?.packageType
              ) ||
              "parcel",

            description:
              nullableString(
                req.body
                  ?.description
              ),

            weight:
              req.body?.weight ??
              null,

            weight_unit:
              cleanString(
                req.body
                  ?.weightUnit
              ) ||
              "kg",

            status:
              cleanString(
                req.body?.status
              ) ||
              "pending",

            estimated_delivery_date:
              req.body
                ?.estimatedDeliveryDate ||
              null,

            current_location:
              nullableString(
                req.body
                  ?.currentLocation
              ),

            current_facility_id:
              nullableString(
                req.body
                  ?.currentFacilityId
              ),
          })
          .select("*")
          .single();

      if (error) {
        console.error(
          "Create shipment failed:",
          error
        );

        return res.status(400).json({
          message:
            error.message ||
            "Unable to create shipment.",
        });
      }

      await supabase
        .from("audit_logs")
        .insert({
          actor_id:
            req.auth.user.id,

          action:
            "create_shipment",

          entity_type:
            "shipment",

          entity_id:
            data.id,

          description:
            `Administrator created shipment ${data.tracking_number}.`,
        });

      return res.status(201).json({
        shipment: data,
      });
    } catch (error) {
      console.error(
        "Create shipment error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to create shipment.",
      });
    }
  }
);

/*
 * PUT /api/admin/shipments/:id
 */
router.put(
  "/shipments/:id",
  requirePermission("shipment.update"),
  async (req, res) => {
    const shipmentId =
      cleanString(
        req.params.id
      );

    if (!shipmentId) {
      return res.status(400).json({
        message:
          "Shipment ID is required.",
      });
    }

    try {
      const supabase =
        requireSupabase();

      const updates = {};

      const fields = {
        trackingNumber:
          "tracking_number",

        referenceNumber:
          "reference_number",

        senderName:
          "sender_name",

        senderEmail:
          "sender_email",

        senderPhone:
          "sender_phone",

        recipientName:
          "recipient_name",

        recipientEmail:
          "recipient_email",

        recipientPhone:
          "recipient_phone",

        serviceType:
          "service_type",

        packageType:
          "package_type",

        description:
          "description",

        weight:
          "weight",

        weightUnit:
          "weight_unit",

        status:
          "status",

        estimatedDeliveryDate:
          "estimated_delivery_date",

        actualDeliveryDate:
          "actual_delivery_date",

        deliveredAt:
          "delivered_at",

        deliveryNotes:
          "delivery_notes",

        currentLocation:
          "current_location",

        currentFacilityId:
          "current_facility_id",

        assignedCourierId:
          "assigned_courier_id",

        originFacilityId:
          "origin_facility_id",

        destinationFacilityId:
          "destination_facility_id",
      };

      for (
        const [
          requestField,
          databaseField,
        ] of Object.entries(
          fields
        )
      ) {
        if (
          req.body[
            requestField
          ] !== undefined
        ) {
          updates[
            databaseField
          ] =
            req.body[
              requestField
            ];
        }
      }

      if (
        updates.tracking_number
      ) {
        updates.tracking_number =
          cleanString(
            updates.tracking_number
          ).toUpperCase();
      }

      updates.updated_at =
        new Date().toISOString();

      const {
        data,
        error,
      } =
        await supabase
          .from("shipments")
          .update(updates)
          .eq(
            "id",
            shipmentId
          )
          .select("*")
          .maybeSingle();

      if (error) {
        console.error(
          "Update shipment failed:",
          error
        );

        return res.status(400).json({
          message:
            error.message ||
            "Unable to update shipment.",
        });
      }

      if (!data) {
        return res.status(404).json({
          message:
            "Shipment not found.",
        });
      }

      await supabase
        .from("audit_logs")
        .insert({
          actor_id:
            req.auth.user.id,

          action:
            "update_shipment",

          entity_type:
            "shipment",

          entity_id:
            shipmentId,

          description:
            `Administrator updated shipment ${data.tracking_number}.`,

          metadata: {
            changes:
              updates,
          },
        });

      return res.status(200).json({
        shipment: data,
      });
    } catch (error) {
      console.error(
        "Update shipment error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to update shipment.",
      });
    }
  }
);

/*
 * GET /api/admin/shipments/:id/history
 */
router.get(
  "/shipments/:id/history",
  requirePermission("tracking.read"),
  async (req, res) => {
    try {
      const supabase =
        requireSupabase();

      const {
        data,
        error,
      } =
        await supabase
          .from("shipment_events")
          .select("*")
          .eq(
            "shipment_id",
            req.params.id
          )
          .order(
            "event_time",
            {
              ascending: false,
            }
          );

      if (error) {
        return res.status(500).json({
          message:
            "Unable to retrieve shipment history.",
        });
      }

      return res.status(200).json({
        events:
          data || [],
      });
    } catch (error) {
      console.error(
        "Shipment history error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve shipment history.",
      });
    }
  }
);

/*
 * POST /api/admin/shipments/:id/events
 */
router.post(
  "/shipments/:id/events",
  requirePermission("shipment.dispatch"),
  async (req, res) => {
    const status =
      cleanString(
        req.body?.status
      );

    const title =
      cleanString(
        req.body?.title
      );

    if (!status || !title) {
      return res.status(400).json({
        message:
          "Status and event title are required.",
      });
    }

    try {
      const supabase =
        requireSupabase();

      const {
        data,
        error,
      } =
        await supabase
          .from("shipment_events")
          .insert({
            shipment_id:
              req.params.id,

            status,

            title,

            description:
              nullableString(
                req.body
                  ?.description
              ),

            location:
              nullableString(
                req.body
                  ?.location
              ),

            facility_id:
              nullableString(
                req.body
                  ?.facilityId
              ),

            courier_id:
              nullableString(
                req.body
                  ?.courierId
              ),

            event_time:
              req.body?.eventTime ||
              new Date().toISOString(),
          })
          .select("*")
          .single();

      if (error) {
        return res.status(400).json({
          message:
            error.message ||
            "Unable to create tracking event.",
        });
      }

      await supabase
        .from("audit_logs")
        .insert({
          actor_id:
            req.auth.user.id,

          action:
            "create_shipment_event",

          entity_type:
            "shipment",

          entity_id:
            req.params.id,

          description:
            `Administrator added tracking event to shipment ${req.params.id}.`,
        });

      return res.status(201).json({
        event: data,
      });
    } catch (error) {
      console.error(
        "Create tracking event error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to create tracking event.",
      });
    }
  }
);

/*
 * DELETE /api/admin/shipments/:id
 */
router.delete(
  "/shipments/:id",
  requirePermission("shipment.delete"),
  async (req, res) => {
    try {
      const supabase =
        requireSupabase();

      const {
        data: shipment,
      } =
        await supabase
          .from("shipments")
          .select(
            "tracking_number"
          )
          .eq(
            "id",
            req.params.id
          )
          .maybeSingle();

      const {
        error,
      } =
        await supabase
          .from("shipments")
          .delete()
          .eq(
            "id",
            req.params.id
          );

      if (error) {
        return res.status(400).json({
          message:
            error.message ||
            "Unable to delete shipment.",
        });
      }

      await supabase
        .from("audit_logs")
        .insert({
          actor_id:
            req.auth.user.id,

          action:
            "delete_shipment",

          entity_type:
            "shipment",

          entity_id:
            req.params.id,

          description:
            `Administrator deleted shipment ${shipment?.tracking_number || req.params.id}.`,
        });

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error(
        "Delete shipment error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to delete shipment.",
      });
    }
  }
);

export default router;