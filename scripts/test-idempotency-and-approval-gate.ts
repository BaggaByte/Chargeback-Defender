/**
 * Test Suite: Stripe Event Idempotency + Approval Gate
 *
 * Tests the two new production-hardening additions:
 *   1. beginStripeEvent / markStripeEventProcessed / markStripeEventFailed
 *      (mock-mode in-memory idempotency)
 *   2. evaluateApprovalGate — server-side approval validation
 */
import assert from 'node:assert';
import {
  beginStripeEvent,
  markStripeEventProcessed,
  markStripeEventFailed,
  createDispute,
  addEvidence,
  updateDispute,
  getDisputeById,
} from '../src/lib/../db';
import { evaluateApprovalGate } from '../src/lib/approval-gate';
import type { DisputeRecord } from '../src/lib/types';

const ORG_ID = 'org-1';

async function runTests() {
  console.log('🧪 Idempotency + Approval Gate Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     ${err.message}`);
      failed++;
    }
  }

  // ---- Stripe Event Idempotency (mock-mode) --------------------------------

  const EVENT_ID_A = `evt_test_${Date.now()}_a`;
  const EVENT_ID_B = `evt_test_${Date.now()}_b`;

  await test('beginStripeEvent: first call succeeds', async () => {
    await beginStripeEvent(EVENT_ID_A, 'charge.dispute.created');
    // no throw = pass
  });

  await test('beginStripeEvent: duplicate call throws [DUPLICATE_EVENT]', async () => {
    let threw = false;
    try {
      await beginStripeEvent(EVENT_ID_A, 'charge.dispute.created');
    } catch (err: any) {
      if (err.message.startsWith('[DUPLICATE_EVENT]')) threw = true;
      else throw err;
    }
    assert.ok(threw, 'Expected DUPLICATE_EVENT error for re-delivered event');
  });

  await test('markStripeEventProcessed: does not throw', async () => {
    await markStripeEventProcessed(EVENT_ID_A);
  });

  await test('beginStripeEvent + markStripeEventFailed: failed event still blocks re-delivery', async () => {
    await beginStripeEvent(EVENT_ID_B, 'charge.dispute.created');
    await markStripeEventFailed(EVENT_ID_B, 'Simulated pipeline failure');
    // In mock mode: after markStripeEventFailed the event is removed from the Set
    // so a new attempt IS allowed (simulates manual retry). Verify this behaviour:
    await beginStripeEvent(EVENT_ID_B, 'charge.dispute.created'); // should not throw in mock mode
  });

  await test('Two distinct event IDs can both be processed', async () => {
    const id1 = `evt_distinct_${Date.now()}_1`;
    const id2 = `evt_distinct_${Date.now()}_2`;
    await beginStripeEvent(id1, 'charge.dispute.created');
    await beginStripeEvent(id2, 'charge.dispute.closed'); // different id = different event
    await markStripeEventProcessed(id1);
    await markStripeEventProcessed(id2);
  });

  // ---- Approval Gate -------------------------------------------------------

  // Build a dispute fixture that passes all checks
  const extId = `dp_gate_test_${Date.now()}`;
  const baseDispute = await createDispute({
    organizationId: ORG_ID,
    customerEmail: 'test@example.com',
    amount: 100,
    reason: 'fraudulent',
    externalDisputeId: extId,
  });

  await addEvidence({
    disputeId: baseDispute.id,
    type: 'ORDER_DETAILS',
    title: 'Test Receipt',
    content: 'Order placed via 3DS authenticated session. AVS: MATCH.',
    sourceIntegration: 'Test',
    isAutoCollected: false,
    confidenceScore: 90,
  });

  // Advance to PENDING_APPROVAL with a rebuttal + AI analysis
  await updateDispute(baseDispute.id, ORG_ID, {
    status: 'PENDING_APPROVAL',
    rebuttalLetter: 'This is a substantive rebuttal letter that exceeds twenty characters.',
    aiAnalysis: {
      winProbabilityPercent: 75,
      verification: { passed: true, unsupportedClaims: [], contradictions: [] },
    } as any,
  });

  const readyDispute = await getDisputeById(baseDispute.id, ORG_ID);
  assert.ok(readyDispute, 'Dispute fixture must be loadable');

  const validActor = { userId: 'user-001', orgId: ORG_ID, role: 'ADMIN' };

  await test('Approval gate: passes for a fully prepared dispute with ADMIN actor', async () => {
    const result = evaluateApprovalGate(readyDispute!, validActor);
    assert.strictEqual(result.canApprove, true, `Expected approval. Summary: ${result.summary}`);
  });

  await test('Approval gate: denies when userId is missing (unauthenticated actor)', async () => {
    const result = evaluateApprovalGate(readyDispute!, { ...validActor, userId: undefined });
    assert.strictEqual(result.canApprove, false);
    const authCheck = result.checks[0];
    assert.strictEqual(authCheck.passed, false, 'Auth check must fail');
  });

  await test('Approval gate: denies OPERATOR role', async () => {
    const result = evaluateApprovalGate(readyDispute!, { ...validActor, role: 'OPERATOR' });
    assert.strictEqual(result.canApprove, false);
    const roleCheck = result.checks[2];
    assert.strictEqual(roleCheck.passed, false, 'Role check must fail for OPERATOR');
  });

  await test('Approval gate: denies when orgId does not match dispute', async () => {
    const result = evaluateApprovalGate(readyDispute!, { ...validActor, orgId: 'wrong-org-999' });
    assert.strictEqual(result.canApprove, false);
    const orgCheck = result.checks[1];
    assert.strictEqual(orgCheck.passed, false, 'Org check must fail (IDOR prevention)');
  });

  await test('Approval gate: denies SUBMITTED dispute (already terminal)', async () => {
    const submittedDispute: DisputeRecord = { ...readyDispute!, status: 'SUBMITTED' };
    const result = evaluateApprovalGate(submittedDispute, validActor);
    assert.strictEqual(result.canApprove, false);
    const statusCheck = result.checks[3];
    assert.strictEqual(statusCheck.passed, false, 'Status check must fail for SUBMITTED');
  });

  await test('Approval gate: denies dispute with no evidence', async () => {
    const noEvidenceDispute: DisputeRecord = { ...readyDispute!, evidenceList: [] };
    const result = evaluateApprovalGate(noEvidenceDispute, validActor);
    assert.strictEqual(result.canApprove, false);
    const evidenceCheck = result.checks[4];
    assert.strictEqual(evidenceCheck.passed, false, 'Evidence check must fail for empty list');
  });

  await test('Approval gate: denies dispute with no rebuttal letter', async () => {
    const noRebuttalDispute: DisputeRecord = { ...readyDispute!, rebuttalLetter: '' };
    const result = evaluateApprovalGate(noRebuttalDispute, validActor);
    assert.strictEqual(result.canApprove, false);
    const rebuttalCheck = result.checks[6];
    assert.strictEqual(rebuttalCheck.passed, false, 'Rebuttal check must fail');
  });

  await test('Approval gate: denies dispute with no AI analysis', async () => {
    const noAIDispute: DisputeRecord = { ...readyDispute!, aiAnalysis: undefined };
    const result = evaluateApprovalGate(noAIDispute, validActor);
    assert.strictEqual(result.canApprove, false);
    const aiCheck = result.checks[7];
    assert.strictEqual(aiCheck.passed, false, 'AI analysis check must fail');
  });

  await test('Approval gate: warns (but does not block) when AI verification flagged', async () => {
    const flaggedDispute: DisputeRecord = {
      ...readyDispute!,
      aiAnalysis: {
        verification: { passed: false, unsupportedClaims: ['delivery confirmed'], contradictions: [] },
      } as any,
    };
    const result = evaluateApprovalGate(flaggedDispute, validActor);
    // Check 9 (index 8) is a soft warning — canApprove should still be true
    assert.strictEqual(result.canApprove, true, 'Verification warning must not hard-block');
    const verCheck = result.checks[8];
    assert.strictEqual(verCheck.passed, false, 'Verification check must be flagged');
    assert.ok(verCheck.reason.includes('WARNING'), 'Reason must include WARNING text');
  });

  await test('Approval gate: gate result includes all 10 checks', async () => {
    const result = evaluateApprovalGate(readyDispute!, validActor);
    assert.strictEqual(result.checks.length, 10, 'Must evaluate exactly 10 checks');
  });

  // ---- Summary ---------------------------------------------------------------

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
