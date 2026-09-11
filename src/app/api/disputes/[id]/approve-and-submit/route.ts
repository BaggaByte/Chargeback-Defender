import { NextRequest, NextResponse } from 'next/server';
import {
  getDisputeById,
  updateDispute,
  addNotification,
  addAuditLog,
  submitDisputeToProcessor,
} from '@/db';
import { auth } from '@/auth';
import { evaluateApprovalGate } from '@/lib/approval-gate';

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

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'User does not belong to an organization' },
        { status: 403 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const body = await req.json().catch(() => ({}));
    const { approvalNotes } = body;
    // NOTE: client-supplied checklist booleans are intentionally ignored —
    //       the server calculates readiness from the database state.

    const dispute = await getDisputeById(resolvedParams.id, orgId);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    // --- Server-side Approval Gate ---
    const gate = evaluateApprovalGate(dispute, { userId, orgId, role });

    if (!gate.canApprove) {
      // Log the attempt so it is auditable even when denied
      await addAuditLog({
        organizationId: orgId,
        userId,
        userName,
        userRole: role || 'UNKNOWN',
        action: 'DISPUTE_APPROVAL_DENIED',
        entityType: 'DISPUTE',
        entityId: dispute.id,
        details: gate.summary,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Approval requirements not met',
          gate: {
            canApprove: false,
            summary: gate.summary,
            checks: gate.checks,
          },
        },
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
        approvalNotes:
          approvalNotes || 'Evidence reviewed and verified against card brand rules.',
        approvedAt: now,
        submittedAt: now,
      },
      {
        userId,
        actorName: userName,
        actorRole: role || 'UNKNOWN',
        action: 'DISPUTE_APPROVED_AND_SUBMITTED',
        details: gate.summary,
      }
    );

    // Transmit evidence package to the processor
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
      details: `Evidence package for ${dispute.externalDisputeId} ($${dispute.amount.toFixed(2)}) approved and transmitted to ${dispute.processor.toUpperCase()}. ${gate.summary}`,
    });

    await addNotification({
      organizationId: orgId,
      title: `Dispute Submitted: ${dispute.externalDisputeId}`,
      message: `Evidence of $${dispute.amount.toFixed(2)} was sent to ${dispute.processor.toUpperCase()} for acquiring review.`,
      type: 'APPROVAL_NEEDED',
      severity: 'info',
      read: false,
      linkUrl: `/disputes/${dispute.id}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Dispute approved and submitted to payment processor.',
      data: updated,
      gate: {
        canApprove: true,
        summary: gate.summary,
        checks: gate.checks,
      },
    });
  } catch (error: any) {
    if (error.name === 'InvalidDisputeStateTransitionError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('[approve-and-submit] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
