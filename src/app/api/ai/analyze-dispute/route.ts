import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute } from '@/db';
import { analyzeDisputeWithAI } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { disputeId } = body;

    if (!disputeId) {
      return NextResponse.json({ success: false, error: 'Dispute ID required' }, { status: 400 });
    }

    const dispute = await getDisputeById(disputeId);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    const aiReport = await analyzeDisputeWithAI(dispute);

    // Save AI metrics to dispute record
    await updateDispute(
      dispute.id,
      {
        evidenceStrengthScore: aiReport.overallStrengthScore,
        winProbability: aiReport.winProbabilityPercent,
        aiAnalysis: aiReport,
      },
      {
        actorName: 'Chargeback Defender AI Engine',
        actorRole: 'SYSTEM_BOT',
        action: 'AI_DISPUTE_ANALYSIS',
        details: `Analyzed dispute ${dispute.externalDisputeId}: Score ${aiReport.overallStrengthScore}/100, Win Prob ${aiReport.winProbabilityPercent}%`,
      }
    );

    return NextResponse.json({ success: true, data: aiReport });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
