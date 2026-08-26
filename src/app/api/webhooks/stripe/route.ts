import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createDispute, resolveOrganizationId, isDbAvailable } from '@/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed.', err.message);
        return NextResponse.json({ success: false, error: 'Webhook signature verification failed' }, { status: 400 });
      }
    } else {
      console.warn('No Stripe webhook secret provided, parsing event directly');
      event = JSON.parse(rawBody);
    }

    const effectiveOrgId = (await isDbAvailable())
      ? await resolveOrganizationId('mock-org-456')
      : 'org-1';

    if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
      
      let customerEmail = `customer_${chargeId}@example.com`;
      let customerName = 'Unknown Customer';
      let cardBrand = 'visa';
      let cardLast4 = '0000';

      if (typeof chargeId === 'string' && process.env.STRIPE_SECRET_KEY) {
        try {
          const charge = await stripe.charges.retrieve(chargeId, {
            expand: ['customer', 'payment_method'],
          });
          customerEmail = charge.billing_details?.email || customerEmail;
          customerName = charge.billing_details?.name || customerName;
          
          if (charge.payment_method_details?.card) {
            cardBrand = charge.payment_method_details.card.brand;
            cardLast4 = charge.payment_method_details.card.last4;
          }
        } catch (e) {
          console.warn('Could not fetch charge details from Stripe', e);
        }
      }

      const createdDispute = await createDispute({
        organizationId: effectiveOrgId,
        customerEmail,
        customerName,
        amount: dispute.amount / 100,
        reason: dispute.reason,
        processor: 'stripe',
        cardBrand,
        cardLast4,
        reasonCode: dispute.reason,
        externalDisputeId: dispute.id,
      });

      console.log(`[Workflow Sim] Webhook ingested dispute ${dispute.id}, triggering evidence collection flow in background...`);
      
      // Simulate asynchronous background work
      setTimeout(async () => {
        try {
          const { addEvidence } = await import('@/db');
          const { ShopifyAdapter } = await import('@/lib/integrations/shopify');
          const { EasypostAdapter } = await import('@/lib/integrations/easypost');

          const shopify = new ShopifyAdapter();
          const easypost = new EasypostAdapter();

          // 1. Gather Order Evidence
          const order = await shopify.fetchOrder(createdDispute.order?.externalOrderId || 'ORD-DEFAULT');
          await addEvidence({
            disputeId: createdDispute.id,
            type: 'ORDER_DETAILS',
            title: 'Shopify Order Receipt',
            content: shopify.formatAsEvidence(order),
            sourceIntegration: 'Shopify API',
            isAutoCollected: true,
            confidenceScore: 99,
          });

          // 2. Gather Delivery Evidence
          // We assume the order data gives us a tracking code, or we mock one
          const tracking = await easypost.fetchTracking('1Z9999999999999999');
          await addEvidence({
            disputeId: createdDispute.id,
            type: 'SHIPPING_PROOF',
            title: 'Easypost Delivery Confirmation',
            content: easypost.formatAsEvidence(tracking),
            sourceIntegration: 'Easypost API',
            isAutoCollected: true,
            confidenceScore: 95,
          });

          // 3. Keep the Mock Chat Log
          await addEvidence({
            disputeId: createdDispute.id,
            type: 'CUSTOMER_COMMUNICATION',
            title: 'Auto-gathered Chat Log',
            content: 'Customer interacted with support bot indicating dissatisfaction before the chargeback.',
            sourceIntegration: 'Zendesk (Mock)',
            isAutoCollected: true,
            confidenceScore: 90,
          });

          console.log(`[Workflow Sim] All evidence automatically attached to dispute ${createdDispute.id}`);
          // 4. Trigger AI Analysis
          const { getDisputeById, updateDispute, addAuditLog, addNotification } = await import('@/db');
          const { AIEngine } = await import('@/lib/ai/engine');
          
          const fullyLoadedDispute = await getDisputeById(createdDispute.id, createdDispute.organizationId);
          if (fullyLoadedDispute) {
            const aiEngine = new AIEngine();
            const analysis = await aiEngine.analyzeDispute(fullyLoadedDispute);

            await updateDispute(
              createdDispute.id,
              createdDispute.organizationId,
              {
                winProbability: analysis.winProbability,
                evidenceStrengthScore: analysis.evidenceStrengthScore,
                rebuttalLetter: analysis.rebuttalLetter,
                rebuttalTone: analysis.rebuttalTone,
                status: 'PENDING_APPROVAL',
                aiAnalysis: analysis as any,
              }
            );

            await addAuditLog({
              organizationId: createdDispute.organizationId,
              userName: 'AI Analyst',
              userRole: 'SYSTEM',
              action: 'AI_ANALYSIS_COMPLETED',
              entityType: 'DISPUTE',
              entityId: createdDispute.id,
              details: `AI completed analysis. Win probability: ${analysis.winProbability}%`,
            });

            await addNotification({
              organizationId: createdDispute.organizationId,
              title: 'AI Analysis Ready',
              message: `Analysis complete for ${createdDispute.externalDisputeId}. Draft ready for review.`,
              type: 'DISPUTE_UPDATE',
              severity: 'info',
              read: false,
              linkUrl: `/disputes/${createdDispute.id}`,
            });

            console.log(`[Workflow Sim] AI analysis complete and dispute ${createdDispute.id} is PENDING_APPROVAL`);
          }

        } catch (e) {
          console.error('[Workflow Sim] Error attaching evidence or running AI:', e);
        }
      }, 2000);

      return NextResponse.json({ success: true, message: 'Dispute created' });
    } else if (event.type === 'charge.dispute.closed') {
      const dispute = event.data.object as Stripe.Dispute;
      const { getDisputeById, updateDispute, addAuditLog, addNotification } = await import('@/db');
      
      // We look up the dispute by its external processor id
      // Since our mock getDisputeById accepts ID or external ID, this works seamlessly
      const fullyLoadedDispute = await getDisputeById(dispute.id, effectiveOrgId);

      if (fullyLoadedDispute) {
        const isWon = dispute.status === 'won';
        const finalStatus = isWon ? 'WON' : 'LOST';
        
        await updateDispute(fullyLoadedDispute.id, effectiveOrgId, {
          status: finalStatus,
          resolvedAt: new Date().toISOString(),
        });

        const billingMsg = isWon
          ? `Dispute won! Revenue recovered. A fee of 15% will be applied.`
          : `Dispute lost. A flat processing fee of $15 will be applied.`;

        await addAuditLog({
          organizationId: effectiveOrgId,
          userName: 'Stripe Webhook',
          userRole: 'SYSTEM',
          action: isWon ? 'DISPUTE_WON' : 'DISPUTE_LOST',
          entityType: 'DISPUTE',
          entityId: fullyLoadedDispute.id,
          details: billingMsg,
        });

        await addNotification({
          organizationId: effectiveOrgId,
          title: `Dispute ${finalStatus}`,
          message: `Case ${dispute.id} was closed and marked as ${finalStatus}.`,
          type: 'DISPUTE_UPDATE',
          severity: isWon ? 'success' : 'error',
          read: false,
          linkUrl: `/disputes/${fullyLoadedDispute.id}`,
        });

        return NextResponse.json({ success: true, message: `Dispute outcome tracked: ${finalStatus}` });
      } else {
        return NextResponse.json({ success: false, error: 'Dispute not found for closure tracking' }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, message: 'Unhandled event type' });
  } catch (error: any) {
    console.error('Stripe Webhook API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
