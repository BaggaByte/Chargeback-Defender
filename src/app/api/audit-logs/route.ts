import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const search = searchParams.get('search');

    let list = [...store.auditLogs];

    if (entityType && entityType !== 'ALL') {
      list = list.filter((l) => l.entityType === entityType);
    }

    if (entityId) {
      list = list.filter((l) => l.entityId === entityId);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
