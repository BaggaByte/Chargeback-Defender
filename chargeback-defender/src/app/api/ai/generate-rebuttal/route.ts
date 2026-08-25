import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute } from '@/db';
import { generateRebuttalLetterWithAI } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { disputeId, tone, customInstructions } = body;

    if (!disputeId) {
      return NextResponse.json({ success: false, error: 'Dispute ID required' }, { status: 400 });
    }

    const dispute = await getDisputeById(disputeId);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    const selectedTone = tone || dispute.rebuttalTone || 'firm';
    const letter = await generateRebuttalLetterWithAI(dispute, selectedTone, customInstructions);

    await updateDispute(
      dispute.id,
      {
        rebuttalLetter: letter,
        rebuttalTone: selectedTone,
      },
      {
        actorName: 'AI Rebuttal Generator',
        actorRole: 'SYSTEM_BOT',
        action: 'AI_REBUTTAL_GENERATED',
        details: `Generated ${selectedTone} rebuttal letter for ${dispute.externalDisputeId}`,
      }
    );

    return NextResponse.json({ success: true, data: { rebuttalLetter: letter, tone: selectedTone } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
