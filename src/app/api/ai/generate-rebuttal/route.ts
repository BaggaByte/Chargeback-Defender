import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute } from '@/db';
import { generateRebuttalLetterWithAI } from '@/lib/gemini';
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
    const { disputeId, tone, customInstructions } = body;

    if (!disputeId) {
      return NextResponse.json({ success: false, error: 'Dispute ID required' }, { status: 400 });
    }

    const dispute = await getDisputeById(disputeId, orgId);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    const selectedTone = tone || dispute.rebuttalTone || 'firm';
    const letter = await generateRebuttalLetterWithAI(dispute, selectedTone, customInstructions);

    await updateDispute(
      dispute.id,
      orgId,
      {
        rebuttalLetter: letter,
        rebuttalTone: selectedTone,
      },
      {
        userId: session.user.id,
        actorName: 'AI Rebuttal Generator',
        actorRole: 'SYSTEM_BOT',
        action: 'AI_REBUTTAL_GENERATED',
        details: `Generated ${selectedTone} rebuttal letter for ${dispute.externalDisputeId}`,
      }
    );

    return NextResponse.json({ success: true, data: { rebuttalLetter: letter, tone: selectedTone } });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
