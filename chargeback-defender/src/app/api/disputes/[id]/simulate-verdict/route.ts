import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute, addNotification, addAuditLog } from '@/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();
    const { outcome } = body; // 'WON' | 'LOST'

    if (outcome !== 'WON' && outcome !== 'LOST') {
      return NextResponse.json(
        { success: false, error: 'Outcome must be WON or LOST' },
        { status: 400 }
      );
    }

    const dispute = await getDisputeById(resolvedParams.id);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updated = await updateDispute(resolvedParams.id, {
      status: outcome,
      resolvedAt: now,
    });

    await addAuditLog({
      organizationId: dispute.organizationId,
      userName: `${dispute.processor.toUpperCase()} Network Webhook`,
      userRole: 'PROCESSOR_GATEWAY',
      action: outcome === 'WON' ? 'DISPUTE_WON_REVERSED' : 'DISPUTE_LOST_FINALIZED',
      entityType: 'DISPUTE',
      entityId: dispute.id,
      details:
        outcome === 'WON'
          ? `Processor ${dispute.processor.toUpperCase()} ruled in merchant's favor. Reclaimed $${dispute.amount.toFixed(2)} + $${dispute.feeAmount} fee.`
          : `Processor ${dispute.processor.toUpperCase()} upheld cardholder chargeback for $${dispute.amount.toFixed(2)}.`,
      ipAddress: '52.14.92.11',
    });

    await addNotification({
      organizationId: dispute.organizationId,
      title: outcome === 'WON' ? `Dispute Won! +$${dispute.amount.toFixed(2)}` : `Dispute Lost: $${dispute.amount.toFixed(2)}`,
      message:
        outcome === 'WON'
          ? `Acquiring bank accepted evidence for ${dispute.externalDisputeId}. Funds restored.`
          : `Dispute ${dispute.externalDisputeId} closed with negative determination.`,
      type: outcome === 'WON' ? 'DISPUTE_WON' : 'DISPUTE_LOST',
      severity: outcome === 'WON' ? 'success' : 'critical',
      read: false,
      linkUrl: `/disputes/${dispute.id}`,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
