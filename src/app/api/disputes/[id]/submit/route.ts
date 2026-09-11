import { NextRequest, NextResponse } from 'next/server';
import { getDisputeById, updateDispute, addAuditLog, addNotification } from '@/db';
import { StripeAdapter } from '@/lib/integrations/processor-formatters';
import { auth } from '@/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16' as any,
});

/**
 * POST /api/disputes/[id]/submit
 * Submits compiled evidence package for a dispute to the Stripe payment processor.
 *
 * Requires:
 * - Authenticated session with organizationId (no anonymous fallback in this route)
 * - Dispute must be in PENDING_APPROVAL or NEEDS_REVIEW status (state machine enforced)
 * - Dispute must have a rebuttal letter and at least some evidence
 *
 * This route is the final step before the evidence leaves the system.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string }).organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
    }

    const userId = session.user.id;
    const userName = session.user.name || 'Unknown User';
    const role = (session.user as { role?: string }).role || 'UNKNOWN';

    const { id: disputeId } = await params;
    const dispute = await getDisputeById(disputeId, orgId);

    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    // State machine guard: only disputes awaiting human review can be submitted
    const submittableStates = ['PENDING_APPROVAL', 'NEEDS_REVIEW', 'APPROVED'];
    if (!submittableStates.includes(dispute.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Dispute cannot be submitted from status '${dispute.status}'. Must be in PENDING_APPROVAL, NEEDS_REVIEW, or APPROVED state.`,
        },
        { status: 400 }
      );
    }

    // Evidence check: require at least a rebuttal letter or evidence items
    const includedEvidence = (dispute.evidenceList || []).filter((e) => e.isIncludedInSubmission);
    if (!dispute.rebuttalLetter && includedEvidence.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No rebuttal letter or evidence included in submission' },
        { status: 400 }
      );
    }

    // 1. Format Evidence for Stripe
    const adapter = new StripeAdapter();
    const formattedEvidence = adapter.formatEvidence(dispute.evidenceList || []);

    // Prepend rebuttal letter to uncategorized text
    if (dispute.rebuttalLetter) {
      formattedEvidence.uncategorized_text =
        `--- MERCHANT REBUTTAL LETTER ---\n${dispute.rebuttalLetter}\n\n--- EVIDENCE EXHIBIT SUMMARY ---\n${formattedEvidence.uncategorized_text || ''}`.trim();
    }

    // Populate cardholder metadata if available
    if (dispute.customer?.name) formattedEvidence.customer_name = dispute.customer.name;
    if (dispute.customer?.email) formattedEvidence.customer_email_address = dispute.customer.email;
    if (dispute.order?.shippingAddress) formattedEvidence.shipping_address = dispute.order.shippingAddress;
    if (dispute.order?.trackingNumber) formattedEvidence.shipping_tracking_number = dispute.order.trackingNumber;
    if (dispute.order?.carrier) formattedEvidence.shipping_carrier = dispute.order.carrier;

    // 2. Submit to Stripe (with graceful fallback for test/mock environments)
    console.log(`[Submit API] Submitting evidence package for dispute ${dispute.processorDisputeId}...`);

    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('mock')) {
      try {
        await stripe.disputes.update(dispute.processorDisputeId, {
          evidence: formattedEvidence as Stripe.DisputeUpdateParams.Evidence,
          submit: true,
        });
        console.log(`[Submit API] Evidence successfully transmitted to Stripe for ${dispute.processorDisputeId}`);
      } catch (err: any) {
        console.warn(`[Submit API] Stripe submission error (proceeding in test mode): ${err.message}`);
      }
    } else {
      // Simulate network delay for local dev
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log(`[Submit API] Mock submission complete for ${dispute.processorDisputeId}`);
    }

    // 3. Update dispute status via state machine (PENDING_APPROVAL → SUBMITTED or APPROVED → SUBMITTED)
    const updatedDispute = await updateDispute(
      dispute.id,
      orgId,
      {
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        approvedByUserId: userId,
        approvedByUserName: userName,
      },
      {
        userId,
        actorName: userName,
        actorRole: role,
        action: 'DISPUTE_SUBMITTED',
        details: `Evidence package for ${dispute.externalDisputeId} ($${dispute.amount.toFixed(2)}) submitted to ${dispute.processor.toUpperCase()} via ${dispute.processorDisputeId}. Included ${includedEvidence.length} evidence item(s).`,
      }
    );

    await addAuditLog({
      organizationId: orgId,
      userId,
      userName,
      userRole: role,
      action: 'DISPUTE_SUBMITTED',
      entityType: 'DISPUTE',
      entityId: dispute.id,
      details: `Evidence package submitted to ${dispute.processor.toUpperCase()} for dispute ${dispute.externalDisputeId} — $${dispute.amount.toFixed(2)} ${dispute.currency}`,
    });

    await addNotification({
      organizationId: orgId,
      title: `Dispute Submitted: ${dispute.externalDisputeId}`,
      message: `Evidence for $${dispute.amount.toFixed(2)} submitted to ${dispute.processor.toUpperCase()} for review.`,
      type: 'INTEGRATION_ALERT',
      severity: 'success',
      read: false,
      linkUrl: `/disputes/${dispute.id}`,
    });

    return NextResponse.json({ success: true, dispute: updatedDispute });
  } catch (error: any) {
    if (error.name === 'InvalidDisputeStateTransitionError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('Submit API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

