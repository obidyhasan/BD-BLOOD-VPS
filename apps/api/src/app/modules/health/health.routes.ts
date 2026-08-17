import { Router, Request, Response } from "express";
import { prisma } from "../../shared/prisma";
import { pingRedis } from "../../shared/redis";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  let dbOk = false;
  let dbMessage = "unknown";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    dbMessage = "connected";
  } catch (error) {
    dbMessage = "unavailable";
    console.error("[health] Database readiness check failed:", error);
  }

  const redis = await pingRedis();
  const ok = dbOk && (redis.ok || redis.message === "not configured");
  const redisMessage =
    redis.ok || redis.message === "not configured"
      ? redis.message
      : "unavailable";

  res.status(ok ? 200 : 503).json({
    success: ok,
    message: ok ? "healthy" : "degraded",
    checks: {
      db: { ok: dbOk, message: dbMessage },
      redis: { ok: redis.ok, message: redisMessage },
    },
    timestamp: new Date().toISOString(),
  });
});

export const HealthRoutes = router;
