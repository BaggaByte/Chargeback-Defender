import { NextRequest, NextResponse } from 'next/server';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsRead,
} from '@/db';
import { auth } from '@/auth';

async function handleMarkRead(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const orgId = (session.user as { organizationId?: string }).organizationId;
  if (!orgId) {
    return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
  }

  const body = await req.json();
  const { action, id } = body;

  if (action === 'MARK_READ' && id) {
    const success = await markNotificationAsRead(id, orgId);
    return NextResponse.json({ success });
  }

  if (action === 'MARK_ALL_READ') {
    await markAllNotificationsRead(orgId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
}

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

    const list = await getNotifications(orgId);
    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    return await handleMarkRead(req);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// Legacy: app-shell uses POST for mark-all-read
export async function POST(req: NextRequest) {
  try {
    return await handleMarkRead(req);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
