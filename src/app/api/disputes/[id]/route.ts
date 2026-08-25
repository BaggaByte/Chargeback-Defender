import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute } from '@/db';
import { auth } from '@/auth';

export async function GET(
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
    const dispute = await getDisputeById(resolvedParams.id, orgId); // ENFORCING TENANT ISOLATION

    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: dispute });
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
    const userId = session.user.id;
    const role = (session.user as any).role;
    
    if (role === 'OPERATOR') {
      return NextResponse.json({ success: false, error: 'Forbidden: Operators cannot update disputes' }, { status: 403 });
    }

    if (!orgId) {
      return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();
    const { updates } = body;

    const updated = await updateDispute(
      resolvedParams.id,
      orgId, // ENFORCING TENANT ISOLATION
      updates,
      {
        userId: userId, // Derive identity from session
        actorName: session.user.name || 'Unknown', // No longer trusting client input
        actorRole: (session.user as any).role || 'UNKNOWN',
        action: 'DISPUTE_UPDATED',
        details: `Updated dispute fields: ${Object.keys(updates).join(', ')}`,
      }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
