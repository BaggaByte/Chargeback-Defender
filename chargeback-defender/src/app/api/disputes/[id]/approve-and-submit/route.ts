import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute, addNotification, addAuditLog } from '@/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();
    const { reviewerName, reviewerRole, approvalNotes, verifiedChecklist } = body;

    const dispute = await getDisputeById(resolvedParams.id);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    if (dispute.status === 'SUBMITTED' || dispute.status === 'WON' || dispute.status === 'LOST') {
      return NextResponse.json(
        { success: false, error: `Dispute is already ${dispute.status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updated = await updateDispute(resolvedParams.id, {
      status: 'SUBMITTED',
      approvedByUserName: reviewerName || 'Elena Rostova (Risk Manager)',
      approvedByUserId: 'user-1',
      approvalNotes: approvalNotes || 'Reviewed and verified against card brand rules.',
      approvedAt: now,
      submittedAt: now,
    });

    await addAuditLog({
      organizationId: dispute.organizationId,
      userName: reviewerName || 'Elena Rostova (Risk Manager)',
      userRole: reviewerRole || 'RISK_MANAGER',
      action: 'DISPUTE_APPROVED_AND_SUBMITTED',
      entityType: 'DISPUTE',
      entityId: dispute.id,
      details: `Dispute package for ${dispute.externalDisputeId} ($${dispute.amount.toFixed(2)}) approved & transmitted to ${dispute.processor.toUpperCase()} gateway. Checklist items confirmed: ${verifiedChecklist?.length || 4}.`,
      ipAddress: '198.51.100.22',
    });

    await addNotification({
      organizationId: dispute.organizationId,
      title: `Dispute Submitted: ${dispute.externalDisputeId}`,
      message: `Evidence package of $${dispute.amount.toFixed(2)} was successfully sent to ${dispute.processor.toUpperCase()} for acquiring review.`,
      type: 'APPROVAL_NEEDED',
      severity: 'info',
      read: false,
      linkUrl: `/disputes/${dispute.id}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Dispute approved and submitted to payment processor.',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
