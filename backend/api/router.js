import { Router } from "express";

import healthRouter from "./health.js";
import trackingRouter from "./tracking.js";
import authRouter from "./auth.js";
import customerRouter from "./customer.js";
import adminRouter from "./admin.js";

const router = Router();

/*
 * GET /api
 */
router.get(
  "/",
  (_req, res) => {
    res.status(200).json({
      name: "US Courier API",

      version: "1.0.0",

      status: "online",

      endpoints: {
        health:
          "/api/health",

        tracking:
          "/api/tracking/:trackingNumber",

        auth:
          "/api/auth",

        customer:
          "/api/customer",

        admin:
          "/api/admin",
      },
    });
  }
);

/*
 * Health
 */
router.use(
  "/health",
  healthRouter
);

/*
 * Public tracking
 */
router.use(
  "/tracking",
  trackingRouter
);

/*
 * Authentication
 */
router.use(
  "/auth",
  authRouter
);

/*
 * Customer portal
 */
router.use(
  "/customer",
  customerRouter
);

/*
 * Administrator portal
 */
router.use(
  "/admin",
  adminRouter
);

export default router;