import { NextRequest, NextResponse } from 'next/server';
import { store, addAuditLog } from '@/db';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: store.integrations,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { integrationId, action } = body;

    const item = store.integrations.find((i) => i.id === integrationId);
    if (!item) {
      return NextResponse.json({ success: false, error: 'Integration not found' }, { status: 404 });
    }

    if (action === 'TOGGLE_STATUS') {
      item.status = item.status === 'connected' ? 'disconnected' : 'connected';
      item.lastSyncAt = 'Just now';

      await addAuditLog({
        organizationId: 'org-1',
        userName: 'Admin User',
        userRole: 'SUPER_ADMIN',
        action: 'INTEGRATION_STATUS_CHANGED',
        entityType: 'INTEGRATION',
        entityId: item.id,
        details: `Changed ${item.displayName} status to ${item.status}`,
        ipAddress: '127.0.0.1',
      });

      return NextResponse.json({ success: true, data: item });
    }

    if (action === 'SYNC_NOW') {
      item.lastSyncAt = 'Just now';
      item.status = 'connected';
      item.syncedDisputesCount += Math.floor(Math.random() * 3) + 1;

      await addAuditLog({
        organizationId: 'org-1',
        userName: 'Admin User',
        userRole: 'SUPER_ADMIN',
        action: 'INTEGRATION_SYNC_TRIGGERED',
        entityType: 'INTEGRATION',
        entityId: item.id,
        details: `Manual sync completed for ${item.displayName}. Updated latest webhook timestamps.`,
        ipAddress: '127.0.0.1',
      });

      return NextResponse.json({ success: true, data: item });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
