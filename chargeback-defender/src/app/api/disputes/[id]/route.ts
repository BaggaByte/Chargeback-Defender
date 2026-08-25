import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute } from '@/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const dispute = await getDisputeById(resolvedParams.id);

    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: dispute });
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
    const { updates, auditInfo } = body;

    const updated = await updateDispute(
      resolvedParams.id,
      updates,
      auditInfo || {
        actorName: 'Risk Analyst',
        actorRole: 'DISPUTE_ANALYST',
        action: 'DISPUTE_UPDATED',
        details: `Updated dispute fields: ${Object.keys(updates).join(', ')}`,
      }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
