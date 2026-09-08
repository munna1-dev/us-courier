import "dotenv/config";

import app from "./app.js";

const port = Number(
  process.env.PORT || 3001
);

const host =
  process.env.HOST || "0.0.0.0";

const server = app.listen(
  port,
  host,
  (error) => {
    if (error) {
      console.error(
        "Unable to start server:",
        error
      );

      process.exit(1);
    }

    console.log(
      `US Courier API listening on ${host}:${port}`
    );
  }
);

function shutdown(signal) {
  console.log(
    `${signal} received. Shutting down...`
  );

  server.close((error) => {
    if (error) {
      console.error(
        "Error while shutting down:",
        error
      );

      process.exit(1);
    }

    process.exit(0);
  });
}

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);