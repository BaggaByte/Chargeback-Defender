import { NextRequest, NextResponse } from 'next/server';
import { addEvidence, store, getDisputeById } from '@/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();
    const { type, title, content, sourceIntegration, fileType, fileSize, confidenceScore } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Missing title or content' }, { status: 400 });
    }

    const newEvidence = await addEvidence(
      {
        disputeId: resolvedParams.id,
        type: type || 'ORDER_DETAILS',
        title,
        content,
        sourceIntegration: sourceIntegration || 'Manual Upload',
        fileType: fileType || 'Document',
        fileSize: fileSize || '120 KB',
        isAutoCollected: false,
        confidenceScore: confidenceScore || 90,
        isIncludedInSubmission: true,
        verifiedAt: new Date().toISOString(),
      },
      {
        actorName: 'Operator',
        actorRole: 'DISPUTE_ANALYST',
      }
    );

    const dispute = await getDisputeById(resolvedParams.id);
    return NextResponse.json({ success: true, data: newEvidence, dispute });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();
    const { evidenceId, isIncludedInSubmission } = body;

    const ev = store.evidence.find((e) => e.id === evidenceId);
    if (!ev) {
      return NextResponse.json({ success: false, error: 'Evidence item not found' }, { status: 404 });
    }

    if (typeof isIncludedInSubmission === 'boolean') {
      ev.isIncludedInSubmission = isIncludedInSubmission;
    }

    const dispute = await getDisputeById(resolvedParams.id);
    return NextResponse.json({ success: true, data: ev, dispute });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
