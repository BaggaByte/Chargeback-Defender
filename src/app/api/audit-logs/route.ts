import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { eq, or, ilike, and, desc } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const search = searchParams.get('search');

    let conditions = [eq(auditLogs.organizationId, orgId)];

    if (entityType && entityType !== 'ALL') {
      conditions.push(eq(auditLogs.entityType, entityType));
    }

    if (entityId) {
      conditions.push(eq(auditLogs.entityId, entityId));
    }

    if (search) {
      const q = `%${search}%`;
      const searchCondition = or(
        ilike(auditLogs.action, q),
        ilike(auditLogs.details, q)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const list = await db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt));

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
