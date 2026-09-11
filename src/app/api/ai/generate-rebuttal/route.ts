import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute } from '@/db';
import { getAIProvider } from '@/lib/ai/provider-factory';
import { buildDisputeAIInput } from '@/lib/ai/types';
import { verifyGeneratedRebuttal } from '@/lib/ai/verification';
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

    // Generate rebuttal letter via the configured AI provider
    const selectedTone = tone || dispute.rebuttalTone || 'firm';
    let letter: string;

    try {
      // Attempt letter generation via the active provider's full analysis
      const aiInput = buildDisputeAIInput(dispute);
      const provider = getAIProvider();
      const result = await provider.analyzeDispute(aiInput);
      letter = result.suggestedRebuttalLetter;
    } catch {
      // Graceful fallback to Gemini's dedicated rebuttal generator
      console.warn('[generate-rebuttal] Provider-based generation failed, falling back to Gemini rebuttal generator.');
      letter = await generateRebuttalLetterWithAI(dispute, selectedTone, customInstructions);
    }

    // Anti-hallucination verification — ALWAYS run before persisting
    const aiInput = buildDisputeAIInput(dispute);
    const verification = verifyGeneratedRebuttal(aiInput, letter);

    if (!verification.passed) {
      console.warn(
        `[generate-rebuttal] Verification flagged ${verification.unsupportedClaims.length} unsupported claim(s) and ${verification.contradictions.length} contradiction(s) for dispute ${dispute.externalDisputeId}.`
      );
    }

    await updateDispute(
      dispute.id,
      orgId,
      {
        rebuttalLetter: letter,
        rebuttalTone: selectedTone,
        // Embed verification report in aiAnalysis JSONB for audit trail
        aiAnalysis: {
          ...(dispute.aiAnalysis || {}),
          lastRebuttalVerification: {
            ...verification,
            generatedAt: new Date().toISOString(),
            tone: selectedTone,
          },
        } as any,
      },
      {
        userId: session.user.id,
        actorName: 'AI Rebuttal Generator',
        actorRole: 'SYSTEM_BOT',
        action: 'AI_REBUTTAL_GENERATED',
        details: `Generated ${selectedTone} rebuttal for ${dispute.externalDisputeId}. Verification: ${verification.passed ? 'PASSED' : `FLAGGED (${verification.unsupportedClaims.length} claims, ${verification.contradictions.length} contradictions)`}`,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        rebuttalLetter: letter,
        tone: selectedTone,
        verification,
      },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
