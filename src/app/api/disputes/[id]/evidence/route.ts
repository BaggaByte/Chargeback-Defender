import { NextRequest, NextResponse } from 'next/server';
import { addEvidence, getDisputeById, db } from '@/db';
import { evidence as evidenceSchema } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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
    
    // Verify dispute exists and belongs to org
    const dispute = await getDisputeById(resolvedParams.id, orgId);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    const body = await req.json();
    const { type, title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Missing title or content' }, { status: 400 });
    }

    const newEvidence = await addEvidence(
      {
        disputeId: resolvedParams.id,
        type: type || 'OTHER',
        title,
        content,
      } as any,
      {
        userId: session.user.id,
        actorName: session.user.name || 'Unknown',
        actorRole: (session.user as any).role || 'UNKNOWN',
        organizationId: orgId,
      }
    );

    const updatedDispute = await getDisputeById(resolvedParams.id, orgId);
    return NextResponse.json({ success: true, data: newEvidence, dispute: updatedDispute });
  } catch (error: any) {
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

    const orgId = (session.user as any).organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    
    // Verify dispute exists and belongs to org
    const dispute = await getDisputeById(resolvedParams.id, orgId);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    const body = await req.json();
    const { evidenceId, isIncludedInSubmission } = body;

    if (typeof isIncludedInSubmission === 'boolean') {
      await db.update(evidenceSchema)
        .set({ isAutoCollected: isIncludedInSubmission }) // Using this field as a proxy for the missing boolean in schema
        .where(eq(evidenceSchema.id, evidenceId));
    }

    const updatedDispute = await getDisputeById(resolvedParams.id, orgId);
    return NextResponse.json({ success: true, data: null, dispute: updatedDispute });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
