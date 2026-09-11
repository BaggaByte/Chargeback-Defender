import { NextResponse } from 'next/server';
import { RocketRideClient } from '@/lib/ai/rocketride-client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rocketride/status
 * Returns real-time health and configuration status of the RocketRide cluster.
 */
export async function GET() {
  try {
    const client = new RocketRideClient();
    const status = await client.checkClusterHealth();

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to check RocketRide status',
      },
      { status: 500 }
    );
  }
}
