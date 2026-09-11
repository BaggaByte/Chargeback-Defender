import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute, addAuditLog, addNotification } from '@/db';
import { executeDisputeAnalysis } from '@/lib/ai/provider-factory';
import { buildDisputeAIInput } from '@/lib/ai/types';
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

    const aiInput = buildDisputeAIInput(dispute);
    let analysis;
    try {
      analysis = await executeDisputeAnalysis(aiInput);
    } catch (analysisErr: any) {
      console.error('[AI Analysis Route Error]:', analysisErr.message);

      // Persist failure record on the dispute for observability
      await updateDispute(
        dispute.id,
        orgId,
        {
          aiAnalysis: {
            failed: true,
            error: 'AI analysis pipeline execution failed',
            failedAt: new Date().toISOString(),
          },
        },
        {
          userId: session?.user?.id,
          actorName: 'AI Engine',
          actorRole: 'SYSTEM_BOT',
          action: 'AI_ANALYSIS_FAILED',
          details: `AI analysis failed: ${analysisErr.message}`,
        }
      );

      return NextResponse.json(
        { success: false, error: 'AI analysis service temporarily unavailable' },
        { status: 502 }
      );
    }

    // Determine lifecycle transition: if in intake or evidence gathering, advance to review
    const validAdvanceStates = ['RECEIVED', 'OPEN', 'PROCESSING', 'EVIDENCE_COLLECTING', 'EVIDENCE_READY'];
    const nextStatus = validAdvanceStates.includes(dispute.status) ? 'PENDING_APPROVAL' : dispute.status;

    // Update dispute with AI insights
    const updatedDispute = await updateDispute(
      dispute.id,
      orgId,
      {
        winProbability: analysis.winProbabilityPercent,
        evidenceStrengthScore: analysis.overallStrengthScore,
        rebuttalLetter: analysis.suggestedRebuttalLetter,
        rebuttalTone: 'firm',
        status: nextStatus,
        aiAnalysis: analysis as any,
      },
      {
        userId: session?.user?.id,
        actorName: `${analysis.provider.toUpperCase()} Engine`,
        actorRole: 'SYSTEM_BOT',
        action: 'AI_ANALYSIS_COMPLETED',
        details: `Analysis completed by ${analysis.provider} (${analysis.pipeline}). Win prob: ${analysis.winProbabilityPercent}%, Score: ${analysis.overallStrengthScore}/100, Verification: ${analysis.verification.passed ? 'PASSED' : 'FLAGGED'}${analysis.fallbackUsed ? ' (Fallback used)' : ''}`,
      }
    );

    await addAuditLog({
      organizationId: orgId,
      userName: `${analysis.provider.toUpperCase()} Engine`,
      userRole: 'SYSTEM_BOT',
      action: 'AI_ANALYSIS_COMPLETED',
      entityType: 'DISPUTE',
      entityId: dispute.id,
      details: `AI analysis completed via ${analysis.provider}. Win probability: ${analysis.winProbabilityPercent}%`,
    });

    await addNotification({
      organizationId: orgId,
      title: 'AI Analysis Ready',
      message: `Analysis complete for ${dispute.externalDisputeId} (${analysis.provider}). Draft rebuttal ready for review.`,
      type: 'APPROVAL_NEEDED',
      severity: 'info',
      read: false,
      linkUrl: `/disputes/${dispute.id}`,
    });

    return NextResponse.json({ success: true, dispute: updatedDispute, analysis });
  } catch (error: any) {
    console.error('Analyze API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
