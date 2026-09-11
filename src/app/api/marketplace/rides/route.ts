import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createRide, listRides, getDriverById, getRiderById } from '@/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string }).organizationId;
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'User does not belong to an organization' },
        { status: 403 }
      );
    }

    const rides = await listRides(orgId);
    return NextResponse.json({ success: true, data: rides });
  } catch (error: any) {
    console.error('[API /marketplace/rides GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string }).organizationId;
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'User does not belong to an organization' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      driverId,
      riderId,
      pickupAddress,
      pickupLatitude,
      pickupLongitude,
      dropoffAddress,
      dropoffLatitude,
      dropoffLongitude,
      fareAmount,
      platformFee,
      driverEarnings,
      distanceMiles,
      durationMinutes,
      otpVerified,
      telemetry,
    } = body;

    if (!driverId || !riderId || !pickupAddress || !dropoffAddress || fareAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required ride fields' },
        { status: 400 }
      );
    }

    const ride = await createRide(
      {
        organizationId: orgId,
        driverId,
        riderId,
        pickupAddress,
        pickupLatitude: Number(pickupLatitude),
        pickupLongitude: Number(pickupLongitude),
        dropoffAddress,
        dropoffLatitude: Number(dropoffLatitude),
        dropoffLongitude: Number(dropoffLongitude),
        fareAmount: Number(fareAmount),
        platformFee: Number(platformFee ?? 4.5),
        driverEarnings: Number(driverEarnings ?? (Number(fareAmount) - Number(platformFee ?? 4.5))),
        distanceMiles: distanceMiles ? Number(distanceMiles) : undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        otpVerified: otpVerified ?? true,
        stripeChargeId: `ch_ride_${Date.now()}`,
        stripePaymentIntentId: `pi_ride_${Date.now()}`,
        stripeTransferId: `tr_ride_${Date.now()}`,
        telemetry: telemetry || {
          destinationReached: true,
          geofenceProximityMeters: 15,
        },
      },
      {
        userId: session.user.id,
        actorName: session.user.name || 'System',
        actorRole: (session.user as { role?: string }).role || 'OPERATOR',
        organizationId: orgId,
      }
    );

    return NextResponse.json({ success: true, data: ride });
  } catch (error: any) {
    console.error('[API /marketplace/rides POST] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
