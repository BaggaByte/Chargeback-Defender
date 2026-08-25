import { NextRequest, NextResponse } from 'next/server';
import {
  createDispute,
  addEvidence,
  addAuditLog,
  addNotification,
  getDisputes,
  resolveOrganizationId,
  isDbAvailable,
} from '@/db';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const orgId = session?.user
      ? (session.user as { organizationId?: string }).organizationId
      : undefined;

    const body = await req.json();
    const { eventType, payload } = body;

    const effectiveOrgId = orgId ?? (await isDbAvailable()
      ? await resolveOrganizationId('mock-org-456')
      : 'org-1');

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
        organizationId: effectiveOrgId!,
        userId: session?.user?.id,
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
      const openDisputes = await getDisputes({
        organizationId: effectiveOrgId!,
      });
      const openDispute = openDisputes.find((d) =>
        ['OPEN', 'EVIDENCE_COLLECTING', 'PENDING_APPROVAL'].includes(d.status)
      );

      if (openDispute) {
        const ev = await addEvidence(
          {
            disputeId: openDispute.id,
            type: 'SHIPPING_PROOF',
            title: 'Carrier GPS Delivery & Direct Signature Confirmation',
            content:
              'Real-time webhook scan: Delivered by courier to verified cardholder porch. GPS timestamp synchronized with order dispatch log.',
            sourceIntegration: 'FedEx Webhook',
            isAutoCollected: true,
            confidenceScore: 98,
          },
          {
            organizationId: openDispute.organizationId,
            actorName: 'FedEx Webhook Worker',
            actorRole: 'INTEGRATION_BOT',
          }
        );

        await addNotification({
          organizationId: openDispute.organizationId,
          title: `FedEx Proof Synced for ${openDispute.externalDisputeId}`,
          message: 'Delivery scan and signature proof attached automatically.',
          type: 'INTEGRATION_ALERT',
          severity: 'success',
          read: false,
          linkUrl: `/disputes/${openDispute.id}`,
        });

        return NextResponse.json({
          success: true,
          message: 'Carrier delivery proof webhook processed.',
          evidence: ev,
        });
      }

      return NextResponse.json({ success: false, error: 'No open dispute found for evidence attachment' }, { status: 404 });
    }

    if (eventType === 'PRE_DISPUTE_ALERT') {
      await addNotification({
        organizationId: effectiveOrgId!,
        title: 'Verifi / Ethoca Pre-Dispute Alert',
        message:
          'A 24-hour pre-chargeback inquiry was received for $180.00. Resolve now to prevent official dispute filing.',
        type: 'INTEGRATION_ALERT',
        severity: 'warning',
        read: false,
        linkUrl: '/disputes',
      });

      await addAuditLog({
        organizationId: effectiveOrgId!,
        userName: 'Ethoca/Verifi Network',
        userRole: 'INTEGRATION_BOT',
        action: 'PRE_DISPUTE_ALERT_RECEIVED',
        entityType: 'INTEGRATION',
        entityId: 'int-verifi',
        details: 'Received Ethoca/Verifi automated chargeback prevention alert.',
      });

      return NextResponse.json({
        success: true,
        message: 'Pre-dispute alert logged and notification dispatched.',
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown eventType' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
