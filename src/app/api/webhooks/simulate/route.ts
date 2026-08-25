import { NextRequest, NextResponse } from 'next/server';
import { createDispute, addEvidence, addAuditLog, addNotification, db } from '@/db';
import { disputes } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // Simulate webhook logic - realistically this wouldn't use session auth, but webhook secrets. 
    // For this prototype, we'll extract the org from the session if available, or fallback to 'org-1' if testing via curl.
    const orgId = session?.user ? (session.user as any).organizationId : 'org-1';

    const body = await req.json();
    const { eventType, payload } = body;

    if (eventType === 'CHARGEBACK_RECEIVED') {
      const {
        customerEmail = 'alex.ross@example.org',
        customerName = 'Alex Ross',
        amount = 540.0,
        reason = 'Fraudulent - Cardholder Not Recognized',
        processor = 'stripe',
        cardBrand = 'visa',
        cardLast4 = '9120',
      } = payload || {};

      const created = await createDispute({
        organizationId: orgId,
        customerEmail,
        customerName,
        amount: Number(amount),
        reason,
        processor,
        cardBrand,
        cardLast4,
      });

      return NextResponse.json({
        success: true,
        message: `Simulated incoming ${processor.toUpperCase()} dispute event for $${amount}.`,
        dispute: created,
      });
    }

    if (eventType === 'FEDEX_DELIVERY_PROOF') {
      const openDisputes = await db.select().from(disputes).where(
        or(
          eq(disputes.status, 'OPEN'),
          eq(disputes.status, 'EVIDENCE_COLLECTING')
        )
      ).limit(1);

      const openDispute = openDisputes[0];
      if (openDispute) {
        const ev = await addEvidence(
          {
            disputeId: openDispute.id,
            type: 'SHIPPING_PROOF',
            title: `Carrier GPS Delivery & Direct Signature Confirmation`,
            content: `Real-time webhook scan: Delivered by courier to verified cardholder porch. GPS timestamp synchronized with order dispatch log.`,
            isAutoCollected: true,
          } as any,
          {
            organizationId: openDispute.organizationId,
            actorName: 'FedEx Webhook Worker',
            actorRole: 'INTEGRATION_BOT',
          }
        );

        await addNotification({
          organizationId: openDispute.organizationId,
          title: `FedEx Proof Synced for ${openDispute.externalDisputeId}`,
          message: `Delivery scan and signature proof attached automatically.`,
          type: 'INTEGRATION_ALERT',
          severity: 'success',
          read: false,
          linkUrl: `/disputes/${openDispute.id}`,
        } as any);

        return NextResponse.json({
          success: true,
          message: 'Carrier delivery proof webhook processed.',
          evidence: ev,
        });
      }
    }

    if (eventType === 'PRE_DISPUTE_ALERT') {
      await addNotification({
        organizationId: orgId,
        title: 'Verifi / Ethoca Pre-Dispute Alert',
        message: 'A 24-hour pre-chargeback inquiry was received for $180.00. Resolve now to prevent official dispute filing.',
        type: 'INTEGRATION_ALERT',
        severity: 'warning',
        read: false,
        linkUrl: '/disputes',
      } as any);

      await addAuditLog({
        organizationId: orgId,
        action: 'PRE_DISPUTE_ALERT_RECEIVED',
        entityType: 'INTEGRATION',
        entityId: 'int-verifi',
        details: 'Received Ethoca/Verifi automated chargeback prevention alert.',
      } as any);

      return NextResponse.json({
        success: true,
        message: 'Pre-dispute alert logged and notification dispatched.',
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown eventType' }, { status: 400 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
