import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  createDispute,
  resolveOrganizationId,
  isDbAvailable,
  beginStripeEvent,
  markStripeEventProcessed,
  markStripeEventFailed,
} from '@/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  let stripeEventId: string | undefined;

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    // --- Signature Verification ---
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err: any) {
        console.error('[Webhook] Signature verification failed:', err.message);
        return NextResponse.json(
          { success: false, error: 'Webhook signature verification failed' },
          { status: 400 }
        );
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.error('[Webhook] Missing STRIPE_WEBHOOK_SECRET or signature in production.');
      return NextResponse.json(
        { success: false, error: 'Missing webhook signature or secret' },
        { status: 400 }
      );
    } else {
      console.warn('[Webhook] Dev mode: no signature secret configured, parsing event body directly.');
      event = JSON.parse(rawBody);
    }

    stripeEventId = event.id;

    // --- Database-enforced Idempotency ---
    // beginStripeEvent throws [DUPLICATE_EVENT] if this event ID has already been seen.
    try {
      await beginStripeEvent(event.id, event.type);
    } catch (dedupErr: any) {
      if (dedupErr.message?.startsWith('[DUPLICATE_EVENT]')) {
        console.log(`[Webhook] Duplicate event ignored: ${event.id} (${event.type})`);
        return NextResponse.json({ success: true, message: 'Duplicate event ignored' });
      }
      throw dedupErr; // unexpected DB error — let the outer catch handle it
    }

    // --- Resolve Organization ---
    const effectiveOrgId = (await isDbAvailable())
      ? await resolveOrganizationId('mock-org-456')
      : 'org-1';

    // --- Event Routing ---
    if (event.type === 'charge.dispute.created') {
      await handleDisputeCreated(event, effectiveOrgId);
    } else if (event.type === 'charge.dispute.updated') {
      await handleDisputeUpdated(event, effectiveOrgId);
    } else if (event.type === 'charge.dispute.closed') {
      await handleDisputeClosed(event, effectiveOrgId);
    } else {
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    // --- Mark Processed ---
    await markStripeEventProcessed(event.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Webhook] Fatal error:', error);

    // Record failure so the event is not silently re-attempted
    if (stripeEventId) {
      try {
        await markStripeEventFailed(stripeEventId, error.message ?? 'Unknown error');
      } catch {
        // best-effort — don't let mark-failure swallow the original error response
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleDisputeCreated(event: Stripe.Event, effectiveOrgId: string) {
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
        cardBrand = (charge.payment_method_details.card.brand || 'other') as string;
        cardLast4 = charge.payment_method_details.card.last4 || '0000';
      }
    } catch (e) {
      console.warn('[Webhook] Could not fetch charge details from Stripe:', e);
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

  console.log(`[Webhook] Dispute ${dispute.id} ingested → ${createdDispute.id}. Scheduling evidence + AI pipeline.`);

  // Resilient background pipeline: retry-with-backoff evidence collection → AI analysis → PENDING_APPROVAL
  setTimeout(() => {
    runPipelineWithRetry(createdDispute.id, createdDispute.organizationId).catch((pipelineErr) => {
      console.error('[Webhook] Unhandled pipeline background error:', pipelineErr);
    });
  }, 1000);
}

/**
 * Executes evidence gathering and AI pipeline with exponential retry-with-backoff.
 * Prevents silent event drops on transient network or API failures.
 */
async function runPipelineWithRetry(disputeId: string, orgId: string, maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { addEvidence, getDisputeById, updateDispute, addAuditLog, addNotification } = await import('@/db');
      const { ShopifyAdapter } = await import('@/lib/integrations/shopify');
      const { EasypostAdapter } = await import('@/lib/integrations/easypost');
      const { executeDisputeAnalysis } = await import('@/lib/ai/provider-factory');
      const { buildDisputeAIInput } = await import('@/lib/ai/types');

      const loaded = await getDisputeById(disputeId, orgId);
      if (!loaded) return;

      const shopify = new ShopifyAdapter();
      const easypost = new EasypostAdapter();

      // 1. Order evidence (if not already attached)
      if (!loaded.evidenceList || loaded.evidenceList.length === 0) {
        const order = await shopify.fetchOrder(loaded.order?.externalOrderId || 'ORD-DEFAULT');
        await addEvidence({
          disputeId: loaded.id,
          type: 'ORDER_DETAILS',
          title: 'Shopify Order Receipt',
          content: shopify.formatAsEvidence(order),
          sourceIntegration: 'Shopify API',
          isAutoCollected: true,
          confidenceScore: 99,
        });

        // 2. Shipping / delivery evidence
        const tracking = await easypost.fetchTracking('1Z9999999999999999');
        await addEvidence({
          disputeId: loaded.id,
          type: 'SHIPPING_PROOF',
          title: 'EasyPost Delivery Confirmation',
          content: easypost.formatAsEvidence(tracking),
          sourceIntegration: 'EasyPost API',
          isAutoCollected: true,
          confidenceScore: 95,
        });

        // 3. Customer communication
        await addEvidence({
          disputeId: loaded.id,
          type: 'CUSTOMER_COMMUNICATION',
          title: 'Support Interaction Log',
          content: 'Customer contacted support regarding delivery timeline. Responded same day.',
          sourceIntegration: 'Zendesk (Mock)',
          isAutoCollected: true,
          confidenceScore: 90,
        });
      }

      // 4. Reload dispute fresh with evidence & run AI analysis
      const disputeWithEvidence = await getDisputeById(disputeId, orgId);
      if (!disputeWithEvidence) return;

      const analysis = await executeDisputeAnalysis(buildDisputeAIInput(disputeWithEvidence));

      await updateDispute(
        loaded.id,
        orgId,
        {
          winProbability: analysis.winProbabilityPercent,
          evidenceStrengthScore: analysis.overallStrengthScore,
          rebuttalLetter: analysis.suggestedRebuttalLetter,
          rebuttalTone: 'firm',
          status: 'PENDING_APPROVAL',
          aiAnalysis: analysis as any,
        }
      );

      await addAuditLog({
        organizationId: orgId,
        userName: 'AI Pipeline',
        userRole: 'SYSTEM',
        action: 'AI_ANALYSIS_COMPLETED',
        entityType: 'DISPUTE',
        entityId: loaded.id,
        details: `AI analysis complete (attempt ${attempt}). Win probability: ${analysis.winProbabilityPercent}%. Verification: ${analysis.verification.passed ? 'PASSED' : 'FLAGGED'}`,
      });

      await addNotification({
        organizationId: orgId,
        title: 'AI Analysis Ready',
        message: `Analysis complete for ${loaded.externalDisputeId}. Ready for human review.`,
        type: 'APPROVAL_NEEDED',
        severity: 'info',
        read: false,
        linkUrl: `/disputes/${loaded.id}`,
      });

      console.log(`[Webhook] Pipeline complete for dispute ${disputeId} on attempt ${attempt} → PENDING_APPROVAL`);
      return;
    } catch (err: any) {
      console.warn(`[Webhook] Pipeline attempt ${attempt}/${maxRetries} failed for dispute ${disputeId}: ${err.message}`);
      if (attempt < maxRetries) {
        // Exponential backoff delay
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      } else {
        console.error(`[Webhook] Evidence/AI pipeline completely failed for dispute ${disputeId} after ${maxRetries} attempts.`);
        try {
          const { addAuditLog } = await import('@/db');
          await addAuditLog({
            organizationId: orgId,
            userName: 'AI Pipeline',
            userRole: 'SYSTEM',
            action: 'AI_ANALYSIS_FAILED',
            entityType: 'DISPUTE',
            entityId: disputeId,
            details: `Automated evidence/AI analysis exhausted ${maxRetries} retries: ${err.message}`,
          });
        } catch {
          // ignore logging failure
        }
      }
    }
  }
}

async function handleDisputeUpdated(event: Stripe.Event, effectiveOrgId: string) {
  // charge.dispute.updated — e.g. evidence deadline changed or status updated by Stripe
  const stripeDispute = event.data.object as Stripe.Dispute;
  console.log(`[Webhook] charge.dispute.updated for ${stripeDispute.id} — status: ${stripeDispute.status}`);

  const { getDisputeById, updateDispute } = await import('@/db');
  const existing = await getDisputeById(stripeDispute.id, effectiveOrgId);
  if (!existing) {
    console.warn(`[Webhook] Received update for unknown dispute ${stripeDispute.id} — ignoring`);
    return;
  }

  // Only update the deadline if it changed — do not alter dispute status here
  const newDeadline = stripeDispute.evidence_details?.due_by
    ? new Date(stripeDispute.evidence_details.due_by * 1000).toISOString()
    : undefined;

  if (newDeadline && newDeadline !== existing.deadline) {
    await updateDispute(existing.id, effectiveOrgId, { deadline: newDeadline });
    console.log(`[Webhook] Updated deadline for dispute ${existing.id} to ${newDeadline}`);
  }
}

async function handleDisputeClosed(event: Stripe.Event, effectiveOrgId: string) {
  const stripeDispute = event.data.object as Stripe.Dispute;
  const { getDisputeById, updateDispute, addAuditLog, addNotification } = await import('@/db');

  const existing = await getDisputeById(stripeDispute.id, effectiveOrgId);
  if (!existing) {
    console.warn(`[Webhook] charge.dispute.closed for unknown dispute ${stripeDispute.id}`);
    return;
  }

  const isWon = stripeDispute.status === 'won';
  const finalStatus = isWon ? 'WON' : 'LOST';

  await updateDispute(existing.id, effectiveOrgId, {
    status: finalStatus,
    resolvedAt: new Date().toISOString(),
  });

  await addAuditLog({
    organizationId: effectiveOrgId,
    userName: 'Stripe',
    userRole: 'SYSTEM',
    action: isWon ? 'DISPUTE_WON' : 'DISPUTE_LOST',
    entityType: 'DISPUTE',
    entityId: existing.id,
    details: `Dispute ${stripeDispute.id} closed by Stripe as ${finalStatus}.`,
  });

  await addNotification({
    organizationId: effectiveOrgId,
    title: `Dispute ${finalStatus}: ${stripeDispute.id}`,
    message: `Case ${stripeDispute.id} was closed and marked ${finalStatus}.`,
    type: isWon ? 'DISPUTE_WON' : 'DISPUTE_LOST',
    severity: isWon ? 'success' : 'critical',
    read: false,
    linkUrl: `/disputes/${existing.id}`,
  });

  console.log(`[Webhook] Dispute ${existing.id} marked ${finalStatus}`);
}
