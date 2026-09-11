import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getDisputeById,
  getRideById,
  getDriverById,
  getRiderById,
  addEvidence,
} from '@/db';
import { marketplaceLiabilityEngine } from '@/lib/integrations/marketplace-liability-engine';
import { rideEvidenceCollector } from '@/lib/integrations/ride-evidence-collector';

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
    const { disputeId, rideId, autoCollectEvidence } = body;

    if (!disputeId || !rideId) {
      return NextResponse.json(
        { success: false, error: 'disputeId and rideId are required' },
        { status: 400 }
      );
    }

    const dispute = await getDisputeById(disputeId, orgId);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    const ride = await getRideById(rideId, orgId);
    if (!ride) {
      return NextResponse.json({ success: false, error: 'Ride not found' }, { status: 404 });
    }

    const driver = await getDriverById(ride.driverId, orgId);
    const rider = await getRiderById(ride.riderId, orgId);

    // 1. Evaluate liability (Platform vs Driver vs Split)
    const evaluation = marketplaceLiabilityEngine.evaluateLiability({
      dispute,
      ride,
      driver,
      rider,
    });

    const actor = {
      userId: session.user.id,
      actorName: session.user.name || 'System Operator',
      actorRole: (session.user as { role?: string }).role || 'OPERATOR',
      organizationId: orgId,
    };

    // 2. Optionally collect ride compelling evidence and attach to dispute
    let collectedEvidenceCount = 0;
    if (autoCollectEvidence) {
      const evidencePkg = rideEvidenceCollector.collectEvidence({
        disputeId: dispute.id,
        ride,
        driver,
        rider,
      });

      for (const item of evidencePkg.evidenceItems) {
        await addEvidence(
          {
            disputeId: dispute.id,
            type: item.type as any,
            title: item.title,
            content: item.content,
            sourceIntegration: item.sourceIntegration,
          },
          actor
        );
        collectedEvidenceCount++;
      }
    }

    // 3. Execute resolution (record liability and execute transfer reversal if required)
    const result = await marketplaceLiabilityEngine.executeLiabilityResolution({
      disputeId: dispute.id,
      orgId,
      evaluation,
      ride,
      driver,
      auditActor: actor,
    });

    return NextResponse.json({
      success: true,
      data: {
        dispute: result.dispute,
        evaluation,
        transferReversalId: result.transferReversalId,
        collectedEvidenceCount,
      },
    });
  } catch (error: any) {
    console.error('[API /marketplace/disputes/route-liability] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
