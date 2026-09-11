import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { getAIProvider, executeDisputeAnalysis } from '../src/lib/ai/provider-factory';
import { RocketRideClient, RocketRideExecutionError } from '../src/lib/ai/rocketride-client';
import { RocketRideProvider } from '../src/lib/ai/providers/rocketride-provider';
import { GeminiProvider } from '../src/lib/ai/providers/gemini-provider';
import { verifyGeneratedRebuttal } from '../src/lib/ai/verification';
import { DisputeAIInput, buildDisputeAIInput } from '../src/lib/ai/types';
import { createDispute, getDisputeById, updateDispute } from '../src/db';

async function runTests() {
  console.log('🧪 Starting RocketRide AI Integration & Safety Test Suite...\n');

  let passed = 0;
  let failed = 0;

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

  const sampleValidInput: DisputeAIInput = {
    dispute: {
      id: 'disp-test-001',
      externalDisputeId: 'dp_test_1001',
      processorDisputeId: 'dp_proc_1001',
      processor: 'stripe',
      amount: 149.99,
      feeAmount: 15.0,
      currency: 'USD',
      reason: 'fraudulent',
      reasonCode: '10.4',
      cardBrand: 'visa',
      cardLast4: '4242',
      cardholderName: 'Jane Doe',
      createdAt: '2026-03-01T10:00:00.000Z',
    },
    customer: {
      id: 'cust-101',
      email: 'jane.doe@example.com',
      name: 'Jane Doe',
      totalOrdersCount: 4,
      lifetimeValue: 620.0,
      hasAcceptedTos: true,
      tosVersion: '2025.2',
    },
    transaction: {
      id: 'txn-101',
      externalOrderId: 'ORD-9901',
      amount: 149.99,
      currency: 'USD',
      carrier: 'UPS',
      trackingNumber: '1Z9999999999999999',
      carrierStatus: 'DELIVERED',
      deliveredAt: '2026-03-03T15:30:00.000Z',
      deliverySignature: 'J. Doe',
      avsResult: 'MATCH',
      cvcResult: 'MATCH',
      threeDSecure: 'AUTHENTICATED',
    },
    evidence: [
      {
        id: 'ev-1',
        type: 'SHIPPING_PROOF',
        title: 'UPS Proof of Delivery',
        content: 'Package delivered and signed by J. Doe on 2026-03-03',
      },
      {
        id: 'ev-2',
        type: 'ORDER_DETAILS',
        title: 'Order Confirmation & 3D Secure Audit',
        content: 'Order placed with 3D-Secure authenticated liability shift',
      },
    ],
  };

  // ---------------------------------------------------------------------------
  // 1. Provider Selection
  // ---------------------------------------------------------------------------
  await test('Provider Selection: getAIProvider correctly instantiates RocketRide and Gemini providers', () => {
    const rocketRide = getAIProvider('rocketride');
    assert.strictEqual(rocketRide.name, 'rocketride');
    assert.ok(rocketRide instanceof RocketRideProvider);

    const gemini = getAIProvider('gemini');
    assert.strictEqual(gemini.name, 'gemini');
    assert.ok(gemini instanceof GeminiProvider);
  });

  await test('Provider Selection: AI_PROVIDER env switches primary provider dynamically', async () => {
    process.env.AI_PROVIDER = 'rocketride';
    const rrResult = await executeDisputeAnalysis(sampleValidInput);
    assert.strictEqual(rrResult.provider, 'rocketride');
    assert.strictEqual(rrResult.pipeline, 'dispute-analyzer.pipe');

    process.env.AI_PROVIDER = 'gemini';
    const geminiResult = await executeDisputeAnalysis(sampleValidInput);
    assert.strictEqual(geminiResult.provider, 'gemini');

    // Reset back to rocketride
    process.env.AI_PROVIDER = 'rocketride';
  });

  // ---------------------------------------------------------------------------
  // 2. Input Validation Guard
  // ---------------------------------------------------------------------------
  await test('Validation: Malformed or missing dispute payload throws RocketRideExecutionError', async () => {
    const client = new RocketRideClient();

    await assert.rejects(
      // @ts-expect-error Testing invalid input
      async () => await client.executeDisputeAnalyzer({}),
      RocketRideExecutionError,
      'Should reject missing dispute object'
    );

    await assert.rejects(
      // @ts-expect-error Testing invalid input
      async () => await client.executeDisputeAnalyzer({ dispute: { id: '', reason: '' } }),
      RocketRideExecutionError,
      'Should reject empty dispute ID and reason'
    );

    await assert.rejects(
      async () =>
        await client.executeDisputeAnalyzer({
          dispute: {
            id: 'disp-invalid',
            reason: 'fraudulent',
            amount: -10,
            cardBrand: 'visa',
            cardLast4: '1234',
            cardholderName: 'Test',
            currency: 'USD',
            externalDisputeId: 'dp_inv',
            processor: 'stripe',
          },
          evidence: [],
        }),
      RocketRideExecutionError,
      'Should reject non-positive amounts'
    );
  });

  // ---------------------------------------------------------------------------
  // 3. Missing Evidence Detection
  // ---------------------------------------------------------------------------
  await test('Missing Evidence: Explicitly detected and recommended without inventing facts', async () => {
    // Input missing shipping evidence and TOS
    const inputWithoutShipping: DisputeAIInput = {
      ...sampleValidInput,
      transaction: {
        ...sampleValidInput.transaction,
        trackingNumber: undefined,
        carrierStatus: undefined,
        deliverySignature: undefined,
      },
      evidence: [],
      customer: {
        ...sampleValidInput.customer,
        hasAcceptedTos: false,
      },
    };

    const client = new RocketRideClient();
    const result = await client.executeDisputeAnalyzer(inputWithoutShipping);

    assert.ok(result.missingEvidenceRecommendations.length > 0, 'Should detect missing evidence items');

    const deliveryMissing = result.missingEvidenceRecommendations.find(
      (m) => m.type === 'delivery_confirmation'
    );
    assert.ok(deliveryMissing, 'Should explicitly detect missing delivery confirmation');
    assert.strictEqual(deliveryMissing.impact, 'HIGH');
    assert.ok(deliveryMissing.reason.length > 0);

    const tosMissing = result.missingEvidenceRecommendations.find(
      (m) => m.type === 'terms_of_service'
    );
    assert.ok(tosMissing, 'Should explicitly detect missing terms of service');

    // Hallucination guard: rebuttal must NOT claim tracking number or signature when missing
    assert.strictEqual(
      result.suggestedRebuttalLetter.includes('1Z9999999999999999'),
      false,
      'Should not hallucinate tracking number when absent'
    );
  });

  // ---------------------------------------------------------------------------
  // 4. Hallucination Protection & Verification Engine
  // ---------------------------------------------------------------------------
  await test('Hallucination Protection: verifyGeneratedRebuttal flags unsupported delivery claims', () => {
    const inputNoDelivery: DisputeAIInput = {
      ...sampleValidInput,
      transaction: undefined,
      evidence: [],
    };

    const fakeRebuttal = 'We have delivered the package via courier with full proof of delivery.';
    const verification = verifyGeneratedRebuttal(inputNoDelivery, fakeRebuttal);

    assert.strictEqual(verification.passed, false, 'Verification should fail for unsupported delivery claim');
    assert.ok(
      verification.unsupportedClaims.some((c) => c.toLowerCase().includes('delivery')),
      'Should list unsupported delivery claim in report'
    );
  });

  await test('Hallucination Protection: verifyGeneratedRebuttal flags unsupported signature claim', () => {
    const inputNoSignature: DisputeAIInput = {
      ...sampleValidInput,
      transaction: {
        ...sampleValidInput.transaction,
        deliverySignature: undefined,
      },
      evidence: [],
    };

    const fakeRebuttal = 'The customer physically signed by hand upon courier receipt.';
    const verification = verifyGeneratedRebuttal(inputNoSignature, fakeRebuttal);

    assert.strictEqual(verification.passed, false, 'Verification should fail for unsupported signature claim');
    assert.ok(
      verification.unsupportedClaims.some((c) => c.toLowerCase().includes('signature')),
      'Should list unsupported signature claim in report'
    );
  });

  await test('Hallucination Protection: verifyGeneratedRebuttal detects contradiction with EXCEPTION carrier status', () => {
    const inputWithException: DisputeAIInput = {
      ...sampleValidInput,
      transaction: {
        ...sampleValidInput.transaction,
        carrierStatus: 'EXCEPTION',
      },
    };

    const conflictingRebuttal = 'The shipment was successfully delivered without issue to the cardholder.';
    const verification = verifyGeneratedRebuttal(inputWithException, conflictingRebuttal);

    assert.strictEqual(verification.passed, false);
    assert.ok(
      verification.contradictions.some((c) => c.includes('EXCEPTION')),
      'Should flag carrier EXCEPTION status contradiction'
    );
  });

  await test('Hallucination Protection: Grounded rebuttal strictly based on input passes verification', () => {
    const client = new RocketRideClient();
    const result = client.executeDisputeAnalyzer(sampleValidInput);

    // RocketRide client runs verification internally
    return result.then((res) => {
      assert.strictEqual(res.verification.passed, true, 'Grounded result must pass verification');
      assert.strictEqual(res.verification.unsupportedClaims.length, 0);
      assert.strictEqual(res.verification.contradictions.length, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Observable Failure and Fallback
  // ---------------------------------------------------------------------------
  await test('Failure & Fallback: Observable fallback to Gemini when RocketRide fails', async () => {
    process.env.AI_PROVIDER = 'rocketride';
    process.env.AI_FALLBACK_PROVIDER = 'gemini';

    // Mock an invalid remote call by forcing RocketRide client to throw
    const originalMethod = RocketRideClient.prototype.executeDisputeAnalyzer;
    RocketRideClient.prototype.executeDisputeAnalyzer = async () => {
      throw new Error('RocketRide remote cluster connection timed out (504)');
    };

    try {
      const fallbackResult = await executeDisputeAnalysis(sampleValidInput);
      assert.strictEqual(fallbackResult.provider, 'gemini');
      assert.strictEqual(fallbackResult.fallbackUsed, true, 'Must record that fallback was used');
      assert.ok(
        fallbackResult.fallbackReason?.includes('timed out'),
        'Must record explicit fallback reason'
      );
    } finally {
      // Restore original method
      RocketRideClient.prototype.executeDisputeAnalyzer = originalMethod;
      delete process.env.AI_FALLBACK_PROVIDER;
      process.env.AI_PROVIDER = 'rocketride';
    }
  });

  // ---------------------------------------------------------------------------
  // 6. Security: Client Isolation & Secrets
  // ---------------------------------------------------------------------------
  await test('Security: Secrets are server-only and not exposed to browser via NEXT_PUBLIC_', () => {
    const envExamplePath = path.resolve(__dirname, '../.env.example');
    const envContent = fs.readFileSync(envExamplePath, 'utf8');

    assert.strictEqual(
      envContent.includes('NEXT_PUBLIC_ROCKETRIDE'),
      false,
      'No RocketRide keys should have NEXT_PUBLIC_ prefix'
    );
    assert.strictEqual(
      envContent.includes('NEXT_PUBLIC_GEMINI'),
      false,
      'No Gemini keys should have NEXT_PUBLIC_ prefix'
    );
  });

  await test("Security: Client components ('use client') never import server AI engine or RocketRide", () => {
    const srcDir = path.resolve(__dirname, '../src');

    function checkDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes("'use client'") || content.includes('"use client"')) {
            assert.strictEqual(
              content.includes('@/lib/ai/rocketride-client') || content.includes('../lib/ai/rocketride-client'),
              false,
              `Client component ${entry.name} must not import RocketRide client`
            );
            assert.strictEqual(
              content.includes('@/lib/ai/provider-factory') || content.includes('../lib/ai/provider-factory'),
              false,
              `Client component ${entry.name} must not import server provider factory`
            );
          }
        }
      }
    }

    checkDir(srcDir);
  });

  // ---------------------------------------------------------------------------
  // 7. Database Integration & Persistence
  // ---------------------------------------------------------------------------
  await test('Database: AI analysis results and verification metadata persist correctly', async () => {
    const orgId = 'org-1';
    const testExtId = `test_ai_persist_${Date.now()}`;

    const created = await createDispute({
      organizationId: orgId,
      customerEmail: 'persist.test@example.com',
      customerName: 'Persistence Test Customer',
      amount: 199.95,
      reason: 'Fraudulent transaction reported',
      externalDisputeId: testExtId,
    });

    assert.ok(created.id);

    // Execute RocketRide analysis
    const aiInput = buildDisputeAIInput(created);
    const analysis = await executeDisputeAnalysis(aiInput);

    assert.ok(analysis.winProbabilityPercent >= 0);
    assert.ok(analysis.verification);

    // Persist to DB
    const updated = await updateDispute(
      created.id,
      orgId,
      {
        winProbability: analysis.winProbabilityPercent,
        evidenceStrengthScore: analysis.overallStrengthScore,
        rebuttalLetter: analysis.suggestedRebuttalLetter,
        aiAnalysis: analysis as any,
        status: 'PENDING_APPROVAL',
      },
      {
        userId: 'admin-1',
        actorName: 'Test AI Persister',
        actorRole: 'SYSTEM_BOT',
        action: 'AI_ANALYSIS_COMPLETED',
        details: `Dispute analyzed via ${analysis.provider}`,
      }
    );

    assert.ok(updated);
    assert.strictEqual(updated.status, 'PENDING_APPROVAL');

    // Retrieve dispute fresh from DB
    const retrieved = await getDisputeById(created.id, orgId);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.winProbability, analysis.winProbabilityPercent);
    assert.strictEqual(retrieved.evidenceStrengthScore, analysis.overallStrengthScore);

    const savedAnalysis = retrieved.aiAnalysis as any;
    assert.ok(savedAnalysis);
    assert.strictEqual(savedAnalysis.provider, 'rocketride');
    assert.strictEqual(savedAnalysis.pipeline, 'dispute-analyzer.pipe');
    assert.ok(savedAnalysis.verification);
    assert.strictEqual(savedAnalysis.verification.passed, true);
    assert.ok(Array.isArray(savedAnalysis.missingEvidenceRecommendations));
  });

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
