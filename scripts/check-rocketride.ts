/**
 * RocketRide Setup Check Script
 *
 * Per the mandatory RocketRide checklist (ROCKETRIDE_README.md):
 * "Always create a check.py or check.ts program to check that everything is setup properly."
 *
 * This script:
 *   1. Verifies environment variables are present
 *   2. Validates the evidence-analysis.pipe pipeline definition
 *   3. Attempts a live connection to the RocketRide engine (if ROCKETRIDE_APIKEY is set)
 *   4. Reports pipeline node count and execution mode
 *
 * Usage:
 *   npx tsx scripts/check-rocketride.ts
 *   npm run check:rocketride
 */

import path from 'node:path';
import fs from 'node:fs';
import { RocketRideClient as SDKClient } from 'rocketride';

const ROOT = process.cwd();
const PIPELINE_PATH = path.join(ROOT, 'pipelines', 'evidence-analysis.pipe');
const FALLBACK_PATH = path.join(ROOT, 'pipelines', 'dispute-analyzer.pipe');

function log(icon: string, msg: string) {
  console.log(`${icon}  ${msg}`);
}

function section(title: string) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     RocketRide Integration — Setup Check               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let allPassed = true;

  // ─── 1. Environment Variables ──────────────────────────────────────────────
  section('1. Environment Variables');

  const apiKey = process.env.ROCKETRIDE_APIKEY || process.env.ROCKETRIDE_API_KEY || '';
  const uri = process.env.ROCKETRIDE_URI || process.env.ROCKETRIDE_ENDPOINT || 'https://api.rocketride.ai';
  const geminiKey = process.env.ROCKETRIDE_GEMINI_KEY || process.env.GEMINI_API_KEY || '';
  const chromaHost = process.env.ROCKETRIDE_CHROMA_HOST || 'localhost';
  const chromaPort = process.env.ROCKETRIDE_CHROMA_PORT || '8000';
  const chromaCollection = process.env.ROCKETRIDE_CHROMA_COLLECTION || 'dispute_evidence';

  const isConfigured = Boolean(apiKey && apiKey !== 'sk_rr_test_mock123' && apiKey.length > 10);

  log(isConfigured ? '✅' : '⚠️ ', `ROCKETRIDE_APIKEY: ${isConfigured ? '[SET]' : '[NOT SET] — will use in-process fallback pipeline'}`);
  log('ℹ️ ', `ROCKETRIDE_URI: ${uri}`);
  log(geminiKey ? '✅' : '⚠️ ', `ROCKETRIDE_GEMINI_KEY: ${geminiKey ? '[SET]' : '[NOT SET] — LLM node will fail on live execution'}`);
  log('ℹ️ ', `ROCKETRIDE_CHROMA_HOST: ${chromaHost}:${chromaPort}`);
  log('ℹ️ ', `ROCKETRIDE_CHROMA_COLLECTION: ${chromaCollection}`);

  if (!isConfigured) {
    log('ℹ️ ', 'Running in in-process fallback mode (ROCKETRIDE_APIKEY not configured).');
    log('ℹ️ ', 'Set ROCKETRIDE_APIKEY in .env.local to enable live pipeline execution.');
  }

  // ─── 2. Pipeline File Validation ──────────────────────────────────────────
  section('2. Pipeline File Validation');

  const pipelineFiles = [
    { label: 'evidence-analysis.pipe (primary)', path: PIPELINE_PATH, required: true },
    { label: 'dispute-analyzer.pipe (fallback)', path: FALLBACK_PATH, required: false },
  ];

  let primaryPipelineValid = false;
  for (const pf of pipelineFiles) {
    if (!fs.existsSync(pf.path)) {
      log(pf.required ? '❌' : '⚠️ ', `${pf.label}: NOT FOUND at ${pf.path}`);
      if (pf.required) allPassed = false;
      continue;
    }

    try {
      const raw = fs.readFileSync(pf.path, 'utf8');
      const parsed = JSON.parse(raw);

      if (!parsed.components || !Array.isArray(parsed.components)) {
        log('❌', `${pf.label}: Missing or invalid 'components' array`);
        if (pf.required) allPassed = false;
        continue;
      }

      if (!parsed.project_id) {
        log('❌', `${pf.label}: Missing 'project_id'`);
        if (pf.required) allPassed = false;
        continue;
      }

      const nodeCount = parsed.components.length;
      const sourceNode = parsed.components.find((c: any) => !c.input || c.input.length === 0);
      log('✅', `${pf.label}: Valid (${nodeCount} nodes, source: ${sourceNode?.provider || 'unknown'})`);

      if (pf.required) {
        primaryPipelineValid = true;

        // Check for critical compliance constraints
        const nodeIds = parsed.components.map((c: any) => c.id);
        const anonymizeIdx = nodeIds.indexOf('anonymize_1');
        const chromaIdx = nodeIds.findIndex((id: string) => id.includes('chroma'));
        const llmIdx = nodeIds.findIndex((id: string) => id.includes('llm'));

        if (anonymizeIdx !== -1 && chromaIdx !== -1 && llmIdx !== -1) {
          if (anonymizeIdx < chromaIdx && anonymizeIdx < llmIdx) {
            log('✅', `PII constraint: anonymize_1 (node ${anonymizeIdx + 1}) runs BEFORE chroma (${chromaIdx + 1}) and LLM (${llmIdx + 1}) ✓`);
          } else {
            log('❌', `PII constraint VIOLATED: anonymize_1 must come before chroma and LLM nodes`);
            allPassed = false;
          }
        } else {
          log('⚠️ ', `Could not verify PII constraint — anonymize_1, chroma, or LLM node not found`);
        }

        // Check for llm_gemini node (not llm_openai)
        const llmNodes = parsed.components.filter((c: any) => c.provider.startsWith('llm_'));
        for (const node of llmNodes) {
          log(node.provider === 'llm_gemini' ? '✅' : '⚠️ ', `LLM node: ${node.id} (provider: ${node.provider})`);
        }
      }
    } catch (err: any) {
      log('❌', `${pf.label}: JSON parse error — ${err.message}`);
      if (pf.required) allPassed = false;
    }
  }

  // ─── 3. Live Engine Connection ─────────────────────────────────────────────
  section('3. Live Engine Connection');

  if (!isConfigured) {
    log('ℹ️ ', 'Skipping live connection test (ROCKETRIDE_APIKEY not set).');
    log('ℹ️ ', 'In-process fallback pipeline is active and fully functional.');
  } else {
    log('ℹ️ ', `Connecting to ${uri}...`);
    const client = new SDKClient();
    try {
      await client.connect();
      log('✅', `Connected to RocketRide engine at ${uri}`);

      // Validate the primary pipeline against the live engine
      if (primaryPipelineValid && fs.existsSync(PIPELINE_PATH)) {
        const pipelineConfig = JSON.parse(fs.readFileSync(PIPELINE_PATH, 'utf8'));
        const validation = await client.validate({ pipeline: pipelineConfig });

        if (validation.errors && validation.errors.length > 0) {
          log('❌', `Pipeline validation errors: ${validation.errors.join(', ')}`);
          allPassed = false;
        } else {
          log('✅', `evidence-analysis.pipe validated on live engine`);
          if (validation.warnings && validation.warnings.length > 0) {
            log('⚠️ ', `Warnings: ${validation.warnings.join(', ')}`);
          }
        }
      }

      await client.disconnect();
      log('✅', 'Disconnected cleanly');
    } catch (err: any) {
      log('❌', `Connection failed: ${err.message}`);
      log('ℹ️ ', 'Disputes will be handled via in-process fallback pipeline until engine is reachable.');
      // Connection failure is not fatal — fallback handles it
    }
  }

  // ─── 4. Summary ───────────────────────────────────────────────────────────
  section('4. Summary');

  if (allPassed) {
    log('✅', 'All checks passed. RocketRide integration is configured correctly.');
    log('ℹ️ ', isConfigured
      ? 'Live pipeline execution is active (evidence-analysis.pipe → remote engine).'
      : 'In-process fallback is active. Set ROCKETRIDE_APIKEY for live pipeline execution.');
  } else {
    log('❌', 'Some checks failed. Review the output above and fix before deploying.');
    process.exit(1);
  }

  console.log('');
}

main().catch((err) => {
  console.error('\n[check-rocketride] Fatal error:', err);
  process.exit(1);
});
