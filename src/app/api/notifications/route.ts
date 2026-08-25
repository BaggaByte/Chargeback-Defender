import { NextRequest, NextResponse } from 'next/server';
import { store, markNotificationAsRead, markAllNotificationsRead } from '@/db';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: store.notifications,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id } = body;

    if (action === 'MARK_READ' && id) {
      await markNotificationAsRead(id);
      return NextResponse.json({ success: true });
    }

    if (action === 'MARK_ALL_READ') {
      await markAllNotificationsRead();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
