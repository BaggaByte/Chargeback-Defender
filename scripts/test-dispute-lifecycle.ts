import assert from 'node:assert';
import {
  canTransitionDispute,
  validateDisputeTransition,
  InvalidDisputeStateTransitionError,
} from '../src/lib/dispute-state-machine';
import {
  createDispute,
  getDisputeById,
  updateDispute,
  getDisputes,
} from '../src/db';

async function runTests() {
  console.log('🧪 Starting Dispute Lifecycle & State Machine Validation...\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      } catch (err: any) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     Error: ${err.message}`);
        failed++;
      }
    })();
  }

  // ---------------------------------------------------------------------------
  // 1. Valid State Transitions
  // ---------------------------------------------------------------------------
  await test('Valid state transition sequence: RECEIVED -> PROCESSING -> EVIDENCE_READY -> AI_ANALYZED -> NEEDS_REVIEW -> APPROVED -> SUBMITTED -> RESOLVED', () => {
    assert.strictEqual(canTransitionDispute('RECEIVED', 'PROCESSING'), true);
    assert.strictEqual(canTransitionDispute('PROCESSING', 'EVIDENCE_READY'), true);
    assert.strictEqual(canTransitionDispute('EVIDENCE_READY', 'AI_ANALYZED'), true);
    assert.strictEqual(canTransitionDispute('AI_ANALYZED', 'NEEDS_REVIEW'), true);
    assert.strictEqual(canTransitionDispute('NEEDS_REVIEW', 'APPROVED'), true);
    assert.strictEqual(canTransitionDispute('APPROVED', 'SUBMITTED'), true);
    assert.strictEqual(canTransitionDispute('SUBMITTED', 'RESOLVED'), true);
  });

  await test('Valid rejection from review: NEEDS_REVIEW -> REJECTED -> RESOLVED', () => {
    assert.strictEqual(canTransitionDispute('NEEDS_REVIEW', 'REJECTED'), true);
    assert.strictEqual(canTransitionDispute('REJECTED', 'RESOLVED'), true);
  });

  await test('Valid legacy aliases: OPEN -> PENDING_APPROVAL -> SUBMITTED -> WON', () => {
    assert.strictEqual(canTransitionDispute('OPEN', 'PENDING_APPROVAL'), true);
    assert.strictEqual(canTransitionDispute('PENDING_APPROVAL', 'SUBMITTED'), true);
    assert.strictEqual(canTransitionDispute('SUBMITTED', 'WON'), true);
  });

  await test('Dispute DB state transition succeeds and logs transition', async () => {
    const orgId = 'org-1';
    const testExtId = `test_trans_${Date.now()}`;

    // Create a new dispute (starts in OPEN/RECEIVED)
    const dispute = await createDispute({
      organizationId: orgId,
      customerEmail: 'test.user@lifecycle.com',
      customerName: 'Lifecycle Test User',
      amount: 250.0,
      reason: 'Product not received',
      externalDisputeId: testExtId,
    });

    assert.ok(dispute.id, 'Dispute should have an ID');

    // Transition: OPEN -> PENDING_APPROVAL
    const updated = await updateDispute(
      dispute.id,
      orgId,
      { status: 'PENDING_APPROVAL' },
      { userId: 'admin-1', actorName: 'Test Suite', actorRole: 'ADMIN' }
    );

    assert.ok(updated, 'Dispute should be updated');
    assert.strictEqual(updated.status, 'PENDING_APPROVAL');
  });

  // ---------------------------------------------------------------------------
  // 2. Invalid State Transitions
  // ---------------------------------------------------------------------------
  await test('Invalid state transition: cannot jump from RECEIVED directly to SUBMITTED', () => {
    assert.strictEqual(canTransitionDispute('RECEIVED', 'SUBMITTED'), false);
    assert.throws(
      () => validateDisputeTransition('RECEIVED', 'SUBMITTED'),
      InvalidDisputeStateTransitionError
    );
  });

  await test('Invalid state transition: cannot modify a terminal state (RESOLVED -> PROCESSING, WON -> OPEN)', () => {
    assert.strictEqual(canTransitionDispute('RESOLVED', 'PROCESSING'), false);
    assert.strictEqual(canTransitionDispute('WON', 'OPEN'), false);
    assert.strictEqual(canTransitionDispute('LOST', 'SUBMITTED'), false);
    assert.throws(
      () => validateDisputeTransition('RESOLVED', 'PROCESSING'),
      InvalidDisputeStateTransitionError
    );
  });

  await test('Database rejects invalid transition with InvalidDisputeStateTransitionError', async () => {
    const orgId = 'org-1';
    const testExtId = `test_invalid_${Date.now()}`;

    const dispute = await createDispute({
      organizationId: orgId,
      customerEmail: 'invalid.trans@test.com',
      amount: 150.0,
      reason: 'Fraud claim',
      externalDisputeId: testExtId,
    });

    // Attempt illegal transition: OPEN -> RESOLVED
    await assert.rejects(
      async () => {
        await updateDispute(dispute.id, orgId, { status: 'RESOLVED' });
      },
      (err: any) => {
        return (
          err instanceof InvalidDisputeStateTransitionError &&
          err.message.includes("cannot transition dispute from 'OPEN' to 'RESOLVED'")
        );
      }
    );
  });

  // ---------------------------------------------------------------------------
  // 3. Unauthorized & Tenant Access
  // ---------------------------------------------------------------------------
  await test('Unauthorized access: query with non-matching organization returns null', async () => {
    const org1 = 'org-1';
    const org2 = 'org-2';
    const testExtId = `test_tenant_${Date.now()}`;

    const dispute = await createDispute({
      organizationId: org1,
      customerEmail: 'tenant.test@example.com',
      amount: 99.0,
      reason: 'General dispute',
      externalDisputeId: testExtId,
    });

    // Try to access dispute from org2
    const accessedByOrg2 = await getDisputeById(dispute.id, org2);
    assert.strictEqual(accessedByOrg2, null, 'Dispute should NOT be accessible by another organization');

    // Try to update dispute from org2
    const updatedByOrg2 = await updateDispute(dispute.id, org2, {
      rebuttalLetter: 'Malicious modification by unauthorized org',
    });
    assert.strictEqual(updatedByOrg2, null, 'Dispute should NOT be modifiable by another organization');
  });

  // ---------------------------------------------------------------------------
  // 4. Duplicate Operation / Idempotency
  // ---------------------------------------------------------------------------
  await test('Idempotency: Re-ingesting dispute with same externalDisputeId returns existing record without duplicating', async () => {
    const orgId = 'org-1';
    const uniqueExtId = `dp_idempotent_${Date.now()}`;

    // First ingestion
    const firstDispute = await createDispute({
      organizationId: orgId,
      customerEmail: 'idempotent@test.com',
      amount: 320.0,
      reason: 'Duplicate charge',
      externalDisputeId: uniqueExtId,
    });

    assert.ok(firstDispute.id, 'First dispute created');

    // Second ingestion with identical externalDisputeId
    const secondDispute = await createDispute({
      organizationId: orgId,
      customerEmail: 'idempotent@test.com',
      amount: 320.0,
      reason: 'Duplicate charge',
      externalDisputeId: uniqueExtId,
    });

    assert.strictEqual(
      secondDispute.id,
      firstDispute.id,
      'Second dispute call should return the exact existing dispute ID (idempotent)'
    );

    // Verify list does not contain duplicate externalDisputeId
    const allDisputes = await getDisputes({ organizationId: orgId });
    const matches = allDisputes.filter((d) => d.externalDisputeId === uniqueExtId);
    assert.strictEqual(matches.length, 1, 'Only one dispute record should exist for the external ID');
  });

  // ---------------------------------------------------------------------------
  // 5. Nonexistent Dispute
  // ---------------------------------------------------------------------------
  await test('Nonexistent dispute handling: querying and updating nonexistent ID safely returns null', async () => {
    const orgId = 'org-1';
    const nonExistentId = 'dsp-does-not-exist-999999';

    const getResult = await getDisputeById(nonExistentId, orgId);
    assert.strictEqual(getResult, null, 'Querying nonexistent dispute must return null');

    const updateResult = await updateDispute(nonExistentId, orgId, { status: 'SUBMITTED' });
    assert.strictEqual(updateResult, null, 'Updating nonexistent dispute must return null');
  });

  console.log(`\n======================================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
