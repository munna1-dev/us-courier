import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import apiRouter from "./api/router.js";

const app = express();

const allowedOrigins =
  process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : true;

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

if (
  process.env.NODE_ENV !==
  "production"
) {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "US Courier",
    service: "API",
    status: "online",
  });
});

app.use("/api", apiRouter);

/*
 * JSON 404 response for API requests.
 */
app.use(
  "/api",
  (_req, res) => {
    res.status(404).json({
      message: "API endpoint not found.",
    });
  }
);

/*
 * Express error handler.
 */
app.use(
  (
    error,
    _req,
    res,
    _next
  ) => {
    console.error(
      "Unhandled API error:",
      error
    );

    if (res.headersSent) {
      return;
    }

    res.status(500).json({
      message:
        "Internal server error.",
    });
  }
);

export default app;