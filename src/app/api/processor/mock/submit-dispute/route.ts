import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute, addNotification } from '@/db';
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

    // Only allow submission if PENDING_APPROVAL (or previously OPEN/EVIDENCE_COLLECTING)
    if (dispute.status === 'SUBMITTED' || dispute.status === 'WON' || dispute.status === 'LOST') {
      return NextResponse.json(
        { success: false, error: `Dispute is already ${dispute.status}` },
        { status: 400 }
      );
    }

    const updated = await updateDispute(
      dispute.id,
      orgId,
      {
        status: 'SUBMITTED',
      },
      {
        userId: session.user.id,
        actorName: 'Mock Processor Gateway',
        actorRole: 'SYSTEM_BOT',
        action: 'DISPUTE_SUBMITTED_TO_PROCESSOR',
        details: `Successfully transmitted dispute ${dispute.externalDisputeId} and evidence payload to ${dispute.processor.toUpperCase()} API.`,
      }
    );

    await addNotification({
      organizationId: dispute.organizationId,
      title: 'Dispute Submitted to Processor',
      message: `Dispute ${dispute.externalDisputeId} transmitted successfully. Awaiting processor determination.`,
      type: 'DISPUTE_SUBMITTED',
      severity: 'info',
      read: false,
      linkUrl: `/disputes/${dispute.id}`,
    } as any);

    return NextResponse.json({
      success: true,
      message: 'Dispute transmitted to processor successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
