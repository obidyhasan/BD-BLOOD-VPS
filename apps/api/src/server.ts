import { createServer } from "http";
import app from "./app";
import config from "./app/config";
import { seedGeoData } from "./app/seed/geoSeed";
import { seedBloodGroups } from "./app/seed/bloodGroupSeed";
import { seedAchievements } from "./app/seed/achievementSeed";
import { seedCanonicalOrganizations } from "./app/seed/organizationSeed";
import { initSocket } from "./app/shared/socket";
import { prisma } from "./app/shared/prisma";
import { closeRedis } from "./app/shared/redis";

async function bootstrap() {
  let server: ReturnType<typeof createServer>;
  try {
    if (process.env.RUN_SEEDS === "true") {
      const isProd = process.env.NODE_ENV === "production";
      await seedGeoData(isProd);
      await seedBloodGroups(isProd);
      await seedAchievements();
      await seedCanonicalOrganizations();
    }

    server = createServer(app);
    initSocket(server);

    server.listen(config.port, () => {
      console.log(`🚀 Server is running on http://localhost:${config.port}`);
    });

    // Graceful shutdown: stop accepting new connections, let in-flight
    // requests finish, close the DB connection pool cleanly, then exit 0
    // (nothing went wrong — we were just asked to stop). Deployment
    // platforms send SIGTERM on every restart/redeploy/scale-down, so
    // without this every deploy would abruptly drop whatever requests and
    // WebSocket connections happened to be in flight at that moment.
    const gracefulShutdown = (signal: string) => {
      console.log(`${signal} received: shutting down gracefully...`);
      if (!server) {
        process.exit(0);
        return;
      }
      server.close(async () => {
        try {
          await Promise.all([prisma.$disconnect(), closeRedis()]);
        } catch (error) {
          console.error("Error disconnecting Prisma during shutdown:", error);
        }
        console.log("Server closed gracefully.");
        process.exit(0);
      });

      // Safety net: if connections never drain (e.g. a stuck long-poll or
      // an open socket that never closes), don't hang the deploy forever.
      setTimeout(() => {
        console.error("Forcing shutdown after timeout — some connections did not close in time.");
        process.exit(1);
      }, 10_000).unref();
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Unhandled rejection: this is an actual bug slipping past every
    // guarded async boundary in the app, not a normal shutdown — treat it
    // as fatal (exit 1) rather than trying to keep serving from an
    // inconsistent state.
    process.on("unhandledRejection", (error) => {
      console.error(
        "Unhandled Rejection detected — closing the server:",
        error,
      );
      if (server) {
        server.close(() => process.exit(1));
      } else {
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("Error during server startup:", error);
    process.exit(1);
  }
}

bootstrap();
