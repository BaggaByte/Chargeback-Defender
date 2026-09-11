import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { RocketRideClient } from '../src/lib/ai/rocketride-client';
import { executeDisputeAnalysis } from '../src/lib/ai/provider-factory';
import { DisputeAIInput } from '../src/lib/ai/types';

async function runMarketplaceTests() {
  console.log('🧪 Starting RocketRide Marketplace & Pipeline Readiness Test Suite...\n');

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

  const sampleInput: DisputeAIInput = {
    dispute: {
      id: 'disp-marketplace-01',
      externalDisputeId: 'dp_market_101',
      processor: 'stripe',
      amount: 249.0,
      currency: 'USD',
      reason: 'fraudulent',
      cardBrand: 'visa',
      cardLast4: '4242',
      cardholderName: 'Alexander Vance',
    },
    transaction: {
      trackingNumber: '1Z9999999999999999',
      carrier: 'UPS',
      carrierStatus: 'DELIVERED',
      threeDSecure: 'AUTHENTICATED',
      avsResult: 'MATCH',
      cvcResult: 'MATCH',
    },
    evidence: [
      {
        type: 'SHIPPING_PROOF',
        title: 'UPS Proof of Delivery',
        content: 'Delivered and signed by A. Vance',
      },
      {
        type: 'ORDER_DETAILS',
        title: 'Order Confirmation',
        content: '3DS verified checkout with matching billing address',
      },
    ],
  };

  // 1. Cluster Health Probe
  await test('Cluster Health: checkClusterHealth() returns valid cluster status and capabilities', async () => {
    const client = new RocketRideClient();
    const health = await client.checkClusterHealth();

    assert.ok(health.status, 'Should have status field');
    assert.ok(
      ['ready', 'in_process_fallback', 'unreachable'].includes(health.status),
      `Status '${health.status}' must be one of ready, in_process_fallback, unreachable`
    );
    assert.ok(health.endpoint, 'Should report cluster endpoint');
    assert.ok(Array.isArray(health.capabilities), 'Should list capabilities');
    assert.ok(health.capabilities.includes('extract_facts'));
    assert.ok(health.capabilities.includes('hallucination_guard'));
  });

  // 2. Pipeline Staging & Deploy API
  await test('Pipeline Deployment: deployPipeline() stages and validates dispute-analyzer.pipe correctly', async () => {
    const client = new RocketRideClient();
    const deployment = await client.deployPipeline('dispute-analyzer');

    assert.strictEqual(deployment.status, 'success');
    assert.ok(deployment.deploymentId.startsWith('rr_dep_'));
    assert.strictEqual(deployment.pipelineName, 'dispute-analyzer');
    assert.ok(deployment.nodesCount >= 5, `Expected at least 5 pipeline components, got ${deployment.nodesCount}`);
    assert.ok(deployment.timestamp);
  });

  await test('Pipeline Deployment: deployPipeline() stages chargeback_defender.pipe', async () => {
    const client = new RocketRideClient();
    const deployment = await client.deployPipeline('chargeback_defender');

    assert.strictEqual(deployment.status, 'success');
    assert.strictEqual(deployment.pipelineName, 'chargeback_defender');
    assert.ok(deployment.nodesCount >= 5);
  });

  // 3. Execution Transparency Tags
  await test('Transparency: executeDisputeAnalysis tags executionMode and isLiveExecution correctly', async () => {
    const result = await executeDisputeAnalysis(sampleInput);

    assert.ok(result.executionMode, 'Result must include executionMode');
    assert.ok(
      result.executionMode === 'remote_cluster' || result.executionMode === 'in_process_fallback',
      `executionMode must be remote_cluster or in_process_fallback, got ${result.executionMode}`
    );
    assert.strictEqual(typeof result.isLiveExecution, 'boolean', 'isLiveExecution must be a boolean');
    assert.ok(result.verification, 'Must include anti-hallucination verification');
    assert.strictEqual(result.verification.passed, true);
  });

  // 4. Marketplace JSON Manifest Validation
  await test('Marketplace Manifest: marketplace.json exists and satisfies schema requirements', () => {
    const manifestPath = path.resolve(__dirname, '../rocketride/marketplace.json');
    assert.ok(fs.existsSync(manifestPath), 'marketplace.json must exist in rocketride directory');

    const content = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(content);

    assert.strictEqual(manifest.name, 'chargeback-defender');
    assert.strictEqual(manifest.version, '2.1.0');
    assert.ok(manifest.publisher?.name, 'Publisher name required');
    assert.ok(manifest.publisher?.email, 'Publisher email required');
    assert.ok(Array.isArray(manifest.pipelines), 'Pipelines list required');
    assert.ok(manifest.pipelines.some((p: any) => p.name === 'dispute-analyzer'));
    assert.ok(manifest.pricing?.plans?.length > 0, 'Pricing plans required');
    assert.ok(manifest.configurationSchema?.required?.includes('DATABASE_URL'));
    assert.ok(manifest.configurationSchema?.required?.includes('STRIPE_SECRET_KEY'));
    assert.ok(manifest.keyFeatures?.length >= 4, 'Key features required');
  });

  // 5. Portable .pipe File Structure
  await test('Pipeline Definition: dispute-analyzer.pipe contains marketplace block and all required stages', () => {
    const pipePath = path.resolve(__dirname, '../rocketride/dispute-analyzer.pipe');
    assert.ok(fs.existsSync(pipePath), 'dispute-analyzer.pipe must exist');

    const content = fs.readFileSync(pipePath, 'utf8');
    assert.ok(content.includes('marketplace:'), 'Must contain marketplace: block');
    assert.ok(content.includes('id: "chargeback-defender-dispute-analyzer"'));
    assert.ok(content.includes('schema_validator'), 'Must include schema_validator');
    assert.ok(content.includes('extract_facts'), 'Must include extract_facts');
    assert.ok(content.includes('hallucination_guard'), 'Must include hallucination_guard');
    assert.ok(content.includes('response_json'), 'Must include response_json');
  });

  // 6. RocketRide Native Micro-Frontend & JSON Pipeline Specification
  await test('RocketRide Native App: apps/chargeback-defender-analyzer and pipelines/ exist with correct specs', () => {
    const appDir = path.resolve(__dirname, '../apps/chargeback-defender-analyzer');
    assert.ok(fs.existsSync(appDir), 'apps/chargeback-defender-analyzer must exist');
    assert.ok(fs.existsSync(path.join(appDir, 'package.json')), 'app package.json must exist');
    assert.ok(fs.existsSync(path.join(appDir, 'src/App.tsx')), 'src/App.tsx must exist');
    assert.ok(fs.existsSync(path.join(appDir, 'src/AppDescriptor.ts')), 'src/AppDescriptor.ts must exist');
    assert.ok(fs.existsSync(path.join(appDir, 'rsbuild.config.mts')), 'rsbuild.config.mts must exist');

    const appPkg = JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), 'utf8'));
    assert.ok(appPkg.appManifest, 'appManifest must be present in package.json');
    assert.strictEqual(appPkg.appManifest.name, 'Chargeback Defender — Dispute Analyzer');
    assert.ok(appPkg.appManifest.billing?.plans?.length > 0, 'Billing plans must be configured');

    const jsonPipePath = path.resolve(__dirname, '../pipelines/dispute-analyzer.pipe');
    assert.ok(fs.existsSync(jsonPipePath), 'pipelines/dispute-analyzer.pipe must exist');
    const jsonPipe = JSON.parse(fs.readFileSync(jsonPipePath, 'utf8'));
    assert.ok(Array.isArray(jsonPipe.components), 'components array must be first in JSON pipeline');
    assert.ok(jsonPipe.project_id, 'project_id required in JSON pipeline');
  });

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runMarketplaceTests().catch((err) => {
  console.error('Fatal error during marketplace tests:', err);
  process.exit(1);
});
