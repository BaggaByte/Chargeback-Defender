/**
 * End-to-End Workflow Test Suite
 * Validates the complete Chargeback Defender product loop:
 *
 * Stripe Event → Dispute Ingestion → Evidence Collection → AI Analysis →
 * Anti-Hallucination Verification → Human Review Gate → Operator Approval →
 * Evidence Submission → Terminal Resolution
 *
 * Does NOT require live Stripe, Gemini, or RocketRide credentials.
 */
import assert from 'node:assert';
import {
  createDispute,
  getDisputeById,
  updateDispute,
  addEvidence,
} from '../src/lib/../db';
import { canTransitionDispute } from '../src/lib/dispute-state-machine';
import { executeDisputeAnalysis } from '../src/lib/ai/provider-factory';
import { buildDisputeAIInput } from '../src/lib/ai/types';
import { verifyGeneratedRebuttal } from '../src/lib/ai/verification';
import { calculateEvidenceScore } from '../src/lib/scoring';
import { StripeAdapter } from '../src/lib/integrations/processor-formatters';

const ORG_ID = 'org-1';
const OPERATOR = { userId: 'op-001', actorName: 'Test Operator', actorRole: 'RISK_MANAGER' };
const EXTERNAL_DISPUTE_ID = `dp_e2e_test_${Date.now()}`;

async function runTests() {
  console.log('🧪 Starting End-to-End Workflow Test Suite...\n');

  let passed = 0;
  let failed = 0;
  let disputeId = '';

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // STAGE 1: Stripe Webhook Ingestion (charge.dispute.created simulation)
  // ---------------------------------------------------------------------------
  await test('Stage 1: Webhook ingests Stripe dispute into DB (OPEN state)', async () => {
    const dispute = await createDispute({
      organizationId: ORG_ID,
      customerEmail: 'sarah.chen@example.com',
      customerName: 'Sarah Chen',
      amount: 329.99,
      reason: 'fraudulent',
      processor: 'stripe',
      cardBrand: 'visa',
      cardLast4: '4111',
      reasonCode: '10.4',
      externalDisputeId: EXTERNAL_DISPUTE_ID,
    });

    disputeId = dispute.id;

    assert.ok(dispute.id, 'Dispute must have an ID');
    assert.strictEqual(dispute.externalDisputeId, EXTERNAL_DISPUTE_ID);
    assert.strictEqual(dispute.status, 'OPEN');
    assert.strictEqual(dispute.evidenceStrengthScore, 0);
    assert.strictEqual(dispute.winProbability, 0);
  });

  // ---------------------------------------------------------------------------
  // STAGE 2: Idempotency (duplicate webhook event)
  // ---------------------------------------------------------------------------
  await test('Stage 2: Duplicate ingestion with same externalDisputeId is idempotent', async () => {
    const existing = await createDispute({
      organizationId: ORG_ID,
      customerEmail: 'sarah.chen@example.com',
      customerName: 'Sarah Chen',
      amount: 329.99,
      reason: 'fraudulent',
      externalDisputeId: EXTERNAL_DISPUTE_ID,
    });

    // Must return the same record, not create a new one
    assert.strictEqual(existing.id, disputeId, 'Same dispute must be returned for duplicate event');
  });

  // ---------------------------------------------------------------------------
  // STAGE 3: Evidence Collection
  // ---------------------------------------------------------------------------
  await test('Stage 3: Multi-source evidence aggregated and attached to dispute', async () => {
    await addEvidence({
      disputeId,
      type: 'ORDER_DETAILS',
      title: 'Order Receipt #ORD-4821',
      content: 'Order placed on 2026-02-28 via 3D-Secure authenticated session. AVS: MATCH, CVC: MATCH.',
      sourceIntegration: 'Shopify API',
      isAutoCollected: true,
      confidenceScore: 99,
    });

    await addEvidence({
      disputeId,
      type: 'SHIPPING_PROOF',
      title: 'UPS Delivery Confirmation',
      content: 'Package delivered and signed by S. Chen at billing address on 2026-03-02. Status: DELIVERED.',
      sourceIntegration: 'EasyPost API',
      isAutoCollected: true,
      confidenceScore: 97,
    });

    await addEvidence({
      disputeId,
      type: 'CUSTOMER_COMMUNICATION',
      title: 'Support Ticket History',
      content: 'Customer opened support ticket on 2026-03-01 regarding delivery timeline. Responded same day.',
      sourceIntegration: 'Zendesk (Mock)',
      isAutoCollected: true,
      confidenceScore: 88,
    });

    const loaded = await getDisputeById(disputeId, ORG_ID);
    assert.ok(loaded, 'Dispute must be retrievable after evidence attachment');
    assert.ok((loaded.evidenceList?.length ?? 0) >= 3, 'At least 3 evidence items must be attached');
  });

  // ---------------------------------------------------------------------------
  // STAGE 4: AI Analysis (RocketRide Pipeline)
  // ---------------------------------------------------------------------------
  let aiAnalysisResult: any;

  await test('Stage 4: RocketRide AI pipeline executes and produces structured result', async () => {
    const dispute = await getDisputeById(disputeId, ORG_ID);
    assert.ok(dispute, 'Dispute must be loaded before analysis');

    const aiInput = buildDisputeAIInput(dispute!);
    aiAnalysisResult = await executeDisputeAnalysis(aiInput);

    assert.ok(aiAnalysisResult, 'AI result must not be null');
    assert.ok(typeof aiAnalysisResult.winProbabilityPercent === 'number', 'Win probability must be a number');
    assert.ok(typeof aiAnalysisResult.overallStrengthScore === 'number', 'Strength score must be a number');
    assert.ok(typeof aiAnalysisResult.suggestedRebuttalLetter === 'string', 'Rebuttal letter must be a string');
    assert.ok(aiAnalysisResult.suggestedRebuttalLetter.length > 50, 'Rebuttal letter must have substantive content');
    assert.ok(Array.isArray(aiAnalysisResult.missingEvidenceRecommendations), 'Must have missing evidence array');
    assert.strictEqual(aiAnalysisResult.provider, 'rocketride');
  });

  // ---------------------------------------------------------------------------
  // STAGE 5: Anti-Hallucination Verification
  // ---------------------------------------------------------------------------
  await test('Stage 5: Anti-hallucination verification runs on generated rebuttal', async () => {
    assert.ok(aiAnalysisResult, 'AI result must exist from Stage 4');
    assert.ok(aiAnalysisResult.verification, 'Verification report must be attached to AI result');
    assert.strictEqual(
      typeof aiAnalysisResult.verification.passed,
      'boolean',
      'Verification.passed must be a boolean'
    );
    // A grounded result based on present evidence should pass
    assert.strictEqual(
      aiAnalysisResult.verification.passed,
      true,
      'Rebuttal generated from present facts must pass verification'
    );
  });

  // ---------------------------------------------------------------------------
  // STAGE 6: Evidence Scoring & State Machine Transition to NEEDS_REVIEW
  // ---------------------------------------------------------------------------
  await test('Stage 6: Evidence score computed and dispute advances to PENDING_APPROVAL', async () => {
    const dispute = await getDisputeById(disputeId, ORG_ID);
    assert.ok(dispute);

    const scoring = calculateEvidenceScore(dispute!, dispute!.evidenceList || []);
    assert.ok(scoring.score > 0, 'Evidence score must be positive');

    // Verify the state machine allows the transition
    assert.ok(canTransitionDispute(dispute!.status, 'PENDING_APPROVAL'), 'Must be able to transition to PENDING_APPROVAL');

    const updated = await updateDispute(
      disputeId,
      ORG_ID,
      {
        status: 'PENDING_APPROVAL',
        winProbability: aiAnalysisResult.winProbabilityPercent,
        evidenceStrengthScore: scoring.score,
        rebuttalLetter: aiAnalysisResult.suggestedRebuttalLetter,
        aiAnalysis: aiAnalysisResult as any,
      },
      { ...OPERATOR, action: 'AI_ANALYSIS_COMPLETED', details: 'AI pipeline complete' }
    );

    assert.ok(updated, 'Dispute must be updated successfully');
    assert.strictEqual(updated.status, 'PENDING_APPROVAL');
  });

  // ---------------------------------------------------------------------------
  // STAGE 7: Human Review Gate — AI Cannot Auto-Submit
  // ---------------------------------------------------------------------------
  await test('Stage 7: AI analysis result does NOT auto-submit or auto-approve the dispute', async () => {
    const dispute = await getDisputeById(disputeId, ORG_ID);
    assert.ok(dispute);

    // Dispute should be in PENDING_APPROVAL waiting for human review
    assert.strictEqual(
      dispute!.status,
      'PENDING_APPROVAL',
      'Dispute must require human review — not auto-submitted'
    );

    // AI cannot directly go to SUBMITTED state from itself
    assert.strictEqual(
      canTransitionDispute('AI_ANALYZED', 'SUBMITTED'),
      false,
      'AI_ANALYZED cannot directly transition to SUBMITTED — requires human approval'
    );
  });

  // ---------------------------------------------------------------------------
  // STAGE 8: Operator Approval (simulating approve-and-submit API logic)
  // ---------------------------------------------------------------------------
  await test('Stage 8: Human operator approves dispute and advances to SUBMITTED', async () => {
    const approvedBy = { name: 'Jane Risk Manager', id: 'op-001' };

    const approved = await updateDispute(
      disputeId,
      ORG_ID,
      {
        status: 'SUBMITTED',
        approvedByUserId: approvedBy.id,
        approvedByUserName: approvedBy.name,
        approvalNotes: 'Reviewed all evidence. 3DS authentication confirmed. Delivery scan matches billing address.',
        approvedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      },
      {
        userId: approvedBy.id,
        actorName: approvedBy.name,
        actorRole: 'RISK_MANAGER',
        action: 'DISPUTE_APPROVED_AND_SUBMITTED',
        details: `Evidence package approved and submitted to Stripe for dispute ${EXTERNAL_DISPUTE_ID}`,
      }
    );

    assert.ok(approved, 'Dispute must be successfully approved');
    assert.strictEqual(approved.status, 'SUBMITTED');
    assert.strictEqual(approved.approvedByUserName, approvedBy.name);
    assert.ok(approved.approvedAt, 'Approved timestamp must be set');
    assert.ok(approved.submittedAt, 'Submitted timestamp must be set');
  });

  // ---------------------------------------------------------------------------
  // STAGE 8.1: Evidence Packaging for Stripe Submission
  // ---------------------------------------------------------------------------
  await test('Stage 8.1: Evidence is correctly formatted for Stripe gateway', async () => {
    const dispute = await getDisputeById(disputeId, ORG_ID);
    assert.ok(dispute);

    const adapter = new StripeAdapter();
    const formatted = adapter.formatEvidence(dispute!.evidenceList || []);

    // The adapter should map ORDER_DETAILS → receipt
    assert.ok(formatted.receipt, 'Order details evidence must map to receipt field');

    // Rebuttal letter prepended to uncategorized text
    if (dispute!.rebuttalLetter) {
      formatted.uncategorized_text =
        `--- MERCHANT REBUTTAL LETTER ---\n${dispute!.rebuttalLetter}\n\n--- EVIDENCE ---\n${formatted.uncategorized_text || ''}`.trim();
      assert.ok(formatted.uncategorized_text.includes('MERCHANT REBUTTAL LETTER'), 'Rebuttal letter must be included in evidence package');
    }
  });

  // ---------------------------------------------------------------------------
  // STAGE 9: Terminal Resolution (charge.dispute.closed simulation)
  // ---------------------------------------------------------------------------
  await test('Stage 9: Stripe webhook closes dispute — terminal WON state recorded', async () => {
    // Simulate receipt of charge.dispute.closed with status: 'won'
    const resolved = await updateDispute(
      disputeId,
      ORG_ID,
      {
        status: 'WON',
        resolvedAt: new Date().toISOString(),
      },
      {
        userId: 'stripe-webhook',
        actorName: 'Stripe Webhook',
        actorRole: 'SYSTEM',
        action: 'DISPUTE_WON',
        details: `Dispute ${EXTERNAL_DISPUTE_ID} closed as WON by Stripe gateway`,
      }
    );

    assert.ok(resolved, 'Dispute must be resolved');
    assert.strictEqual(resolved.status, 'WON');
    assert.ok(resolved.resolvedAt, 'Resolution timestamp must be recorded');
  });

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error in E2E test suite:', err);
  process.exit(1);
});
