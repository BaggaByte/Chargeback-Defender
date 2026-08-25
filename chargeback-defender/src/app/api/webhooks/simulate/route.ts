import { NextRequest, NextResponse } from 'next/server';
import { createDispute, addEvidence, addAuditLog, addNotification, store, getDisputes } from '@/db';

export async function POST(req: NextRequest) {
  try {
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
        organizationId: 'org-1',
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
      const disputes = await getDisputes();
      const openDispute = disputes.find((d) => d.status === 'OPEN' || d.status === 'EVIDENCE_COLLECTING');
      if (openDispute) {
        const ev = await addEvidence(
          {
            disputeId: openDispute.id,
            type: 'SHIPPING_PROOF',
            title: `Carrier GPS Delivery & Direct Signature Confirmation`,
            content: `Real-time webhook scan: Delivered by courier to verified cardholder porch. GPS timestamp synchronized with order dispatch log.`,
            sourceIntegration: 'FedEx Webhook Live',
            fileSize: '512 KB',
            fileType: 'PDF Manifest',
            isAutoCollected: true,
            confidenceScore: 99,
            isIncludedInSubmission: true,
            verifiedAt: new Date().toISOString(),
          },
          {
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
        });

        return NextResponse.json({
          success: true,
          message: 'Carrier delivery proof webhook processed.',
          evidence: ev,
        });
      }
    }

    if (eventType === 'PRE_DISPUTE_ALERT') {
      await addNotification({
        organizationId: 'org-1',
        title: 'Verifi / Ethoca Pre-Dispute Alert',
        message: 'A 24-hour pre-chargeback inquiry was received for $180.00. Resolve now to prevent official dispute filing.',
        type: 'INTEGRATION_ALERT',
        severity: 'warning',
        read: false,
        linkUrl: '/disputes',
      });

      await addAuditLog({
        organizationId: 'org-1',
        userName: 'Verifi CDRN Integration',
        userRole: 'INTEGRATION_BOT',
        action: 'PRE_DISPUTE_ALERT_RECEIVED',
        entityType: 'INTEGRATION',
        entityId: 'int-verifi',
        details: 'Received Ethoca/Verifi automated chargeback prevention alert.',
        ipAddress: '198.51.100.99',
      });

      return NextResponse.json({
        success: true,
        message: 'Pre-dispute alert logged and notification dispatched.',
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown eventType' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
