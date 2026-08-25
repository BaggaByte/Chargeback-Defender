import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getIntegrations, updateIntegration } from '@/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string }).organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
    }

    const data = await getIntegrations(orgId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string }).organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
    }

    const { integrationId, action } = await req.json();

    if (!integrationId || !action) {
      return NextResponse.json({ success: false, error: 'integrationId and action required' }, { status: 400 });
    }

    const updated = await updateIntegration(integrationId, orgId, action);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
