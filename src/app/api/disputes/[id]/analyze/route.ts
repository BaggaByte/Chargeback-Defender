import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute, addAuditLog, addNotification } from '@/db';
import { RocketRideExecutionClient } from '@/lib/rocketride/client';
import { auth } from '@/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const orgId = session?.user
      ? (session.user as { organizationId?: string }).organizationId
      : 'org-1'; // Default for local dev without auth

    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: disputeId } = await params;
    const dispute = await getDisputeById(disputeId, orgId);

    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    const rrClient = new RocketRideExecutionClient();
    const analysis = await rrClient.executePipeline('chargeback_defender', dispute as any);

    // Update dispute with AI insights
    const updatedDispute = await updateDispute(
      dispute.id,
      orgId,
      {
        winProbability: analysis.winProbabilityPercent,
        evidenceStrengthScore: analysis.overallStrengthScore,
        rebuttalLetter: analysis.suggestedRebuttalLetter,
        rebuttalTone: 'firm',
        status: 'PENDING_APPROVAL',
        aiAnalysis: analysis,
      }
    );

    await addAuditLog({
      organizationId: orgId,
      userName: 'AI Analyst',
      userRole: 'SYSTEM',
      action: 'AI_ANALYSIS_COMPLETED',
      entityType: 'DISPUTE',
      entityId: dispute.id,
      details: `AI completed analysis. Win probability: ${analysis.winProbabilityPercent}%`,
    });

    await addNotification({
      organizationId: orgId,
      title: 'AI Analysis Ready',
      message: `Analysis complete for ${dispute.externalDisputeId}. Draft ready for review.`,
      type: 'APPROVAL_NEEDED',
      severity: 'info',
      read: false,
      linkUrl: `/disputes/${dispute.id}`,
    });

    return NextResponse.json({ success: true, dispute: updatedDispute });
  } catch (error: any) {
    console.error('Analyze API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
