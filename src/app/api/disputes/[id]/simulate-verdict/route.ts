import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute, addNotification, db } from '@/db';
import { auditLogs } from '@/db/schema';
import { auth } from '@/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();
    const { outcome } = body; // 'WON' | 'LOST'

    if (outcome !== 'WON' && outcome !== 'LOST') {
      return NextResponse.json(
        { success: false, error: 'Outcome must be WON or LOST' },
        { status: 400 }
      );
    }

    const dispute = await getDisputeById(resolvedParams.id, orgId);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    if (dispute.status !== 'SUBMITTED') {
      return NextResponse.json(
        { success: false, error: `Dispute must be in SUBMITTED state to receive a verdict, currently: ${dispute.status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updated = await updateDispute(
      resolvedParams.id,
      orgId,
      {
        status: outcome,
        resolvedAt: now as any, // Type coercion to satisfy DisputeRecord vs Drizzle mismatch
      },
      {
        userId: session.user.id,
        actorName: `${dispute.processor.toUpperCase()} Network Webhook`,
        actorRole: 'PROCESSOR_GATEWAY',
        action: outcome === 'WON' ? 'DISPUTE_WON_REVERSED' : 'DISPUTE_LOST_FINALIZED',
        details:
          outcome === 'WON'
            ? `Processor ${dispute.processor.toUpperCase()} ruled in merchant's favor. Reclaimed $${dispute.amount}.`
            : `Processor ${dispute.processor.toUpperCase()} upheld cardholder chargeback for $${dispute.amount}.`,
      }
    );

    await addNotification({
      organizationId: dispute.organizationId,
      title: outcome === 'WON' ? `Dispute Won! +$${dispute.amount}` : `Dispute Lost: $${dispute.amount}`,
      message:
        outcome === 'WON'
          ? `Acquiring bank accepted evidence for ${dispute.externalDisputeId}. Funds restored.`
          : `Dispute ${dispute.externalDisputeId} closed with negative determination.`,
      type: outcome === 'WON' ? 'DISPUTE_WON' : 'DISPUTE_LOST',
      severity: outcome === 'WON' ? 'success' : 'critical',
      read: false,
      linkUrl: `/disputes/${dispute.id}`,
    } as any);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
