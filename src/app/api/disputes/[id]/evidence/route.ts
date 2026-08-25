import { NextRequest, NextResponse } from 'next/server';
import { addEvidence, getDisputeById, updateEvidenceInclusion } from '@/db';
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
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);

    const dispute = await getDisputeById(resolvedParams.id, orgId);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    const body = await req.json();
    const { type, title, content, sourceIntegration } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Missing title or content' }, { status: 400 });
    }

    const newEvidence = await addEvidence(
      {
        disputeId: dispute.id,
        type: type || 'OTHER',
        title,
        content,
        sourceIntegration: sourceIntegration || 'Manual Upload',
      },
      {
        userId: session.user.id,
        actorName: session.user.name || 'Unknown',
        actorRole: (session.user as { role?: string }).role || 'UNKNOWN',
        organizationId: orgId,
      }
    );

    const updatedDispute = await getDisputeById(dispute.id, orgId);
    return NextResponse.json({ success: true, data: newEvidence, dispute: updatedDispute });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string }).organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);

    const dispute = await getDisputeById(resolvedParams.id, orgId);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    const body = await req.json();
    const { evidenceId, isIncludedInSubmission } = body;

    if (typeof isIncludedInSubmission !== 'boolean' || !evidenceId) {
      return NextResponse.json({ success: false, error: 'evidenceId and isIncludedInSubmission required' }, { status: 400 });
    }

    const updatedDispute = await updateEvidenceInclusion(
      evidenceId,
      dispute.id,
      orgId,
      isIncludedInSubmission
    );

    return NextResponse.json({ success: true, data: null, dispute: updatedDispute });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
