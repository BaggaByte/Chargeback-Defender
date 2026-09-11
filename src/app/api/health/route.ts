import { db } from "@/db";
import { sql } from "drizzle-orm";
import { RocketRideClient } from "@/lib/ai/rocketride-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus: 'connected' | 'error' = 'connected';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await db.execute(sql`select 1`);
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbStatus = 'error';
  }

  // RocketRide cluster probe
  const rrClient = new RocketRideClient();
  const rocketRideStatus = await rrClient.checkClusterHealth();

  const isHealthy = dbStatus === 'connected';

  return Response.json(
    {
      ok: isHealthy,
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      version: '2.1.0',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      ai: {
        primaryProvider: process.env.AI_PROVIDER || 'rocketride',
        fallbackProvider: process.env.AI_FALLBACK_PROVIDER || 'none',
        hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      },
      rocketride: rocketRideStatus,
    },
    { status: isHealthy ? 200 : 503 }
  );
}

