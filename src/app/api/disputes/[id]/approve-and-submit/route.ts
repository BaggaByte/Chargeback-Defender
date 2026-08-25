import { NextRequest, NextResponse } from 'next/server';
import {
  getDisputeById,
  updateDispute,
  addNotification,
  addAuditLog,
  submitDisputeToProcessor,
} from '@/db';
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

    const orgId = (session.user as { organizationId?: string }).organizationId;
    const userId = session.user.id;
    const userName = session.user.name || 'Unknown User';
    const role = (session.user as { role?: string }).role;

    if (role === 'OPERATOR') {
      return NextResponse.json({ success: false, error: 'Forbidden: Operators cannot approve disputes' }, { status: 403 });
    }

    if (!orgId) {
      return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();
    const { approvalNotes, verifiedChecklist } = body;

    const dispute = await getDisputeById(resolvedParams.id, orgId);
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

    const updated = await updateDispute(
      dispute.id,
      orgId,
      {
        status: 'SUBMITTED',
        approvedByUserName: userName,
        approvedByUserId: userId,
        approvalNotes: approvalNotes || 'Reviewed and verified against card brand rules.',
        approvedAt: now,
        submittedAt: now,
      },
      {
        userId,
        actorName: userName,
        actorRole: role || 'UNKNOWN',
        action: 'DISPUTE_APPROVED_AND_SUBMITTED',
        details: `Dispute ${dispute.externalDisputeId} approved with ${verifiedChecklist?.length ?? 4} checklist items.`,
      }
    );

    // Transmit to processor gateway
    await submitDisputeToProcessor(dispute.id, orgId, {
      userId,
      actorName: `${dispute.processor.toUpperCase()} Gateway`,
      actorRole: 'PROCESSOR_GATEWAY',
    });

    await addAuditLog({
      organizationId: orgId,
      userId,
      userName,
      userRole: role || 'UNKNOWN',
      action: 'DISPUTE_APPROVED_AND_SUBMITTED',
      entityType: 'DISPUTE',
      entityId: dispute.id,
      details: `Evidence package for ${dispute.externalDisputeId} ($${dispute.amount.toFixed(2)}) approved and transmitted to ${dispute.processor.toUpperCase()}.`,
    });

    await addNotification({
      organizationId: orgId,
      title: `Dispute Submitted: ${dispute.externalDisputeId}`,
      message: `Evidence package of $${dispute.amount.toFixed(2)} was sent to ${dispute.processor.toUpperCase()} for acquiring review.`,
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
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
