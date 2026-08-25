import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute } from '@/db';
import { analyzeDisputeWithAI } from '@/lib/gemini';
import { calculateEvidenceScore } from '@/lib/scoring';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
    }

    const body = await req.json();
    const { disputeId } = body;

    if (!disputeId) {
      return NextResponse.json({ success: false, error: 'Dispute ID required' }, { status: 400 });
    }

    const dispute = await getDisputeById(disputeId, orgId);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    const aiReport = await analyzeDisputeWithAI(dispute);
    
    // Deterministic Scoring Engine Replacement
    const deterministicScoring = calculateEvidenceScore(dispute, dispute.evidenceList || []);
    aiReport.overallStrengthScore = deterministicScoring.score;
    // Embed the breakdown in the AI report for the frontend
    (aiReport as any).scoreBreakdown = deterministicScoring.breakdown;

    // Save metrics to dispute record
    await updateDispute(
      dispute.id,
      orgId,
      {
        evidenceStrengthScore: deterministicScoring.score,
        winProbability: aiReport.winProbabilityPercent,
        aiAnalysis: aiReport,
      },
      {
        userId: session.user.id,
        actorName: 'Chargeback Defender AI Engine',
        actorRole: 'SYSTEM_BOT',
        action: 'AI_DISPUTE_ANALYSIS',
        details: `Analyzed dispute ${dispute.externalDisputeId}: Deterministic Score ${deterministicScoring.score}/100, Win Prob ${aiReport.winProbabilityPercent}%`,
      }
    );

    return NextResponse.json({ success: true, data: aiReport });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
