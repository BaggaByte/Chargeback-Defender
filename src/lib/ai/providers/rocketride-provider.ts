import { DisputeAIInput, DisputeAIProvider, DisputeAIResult } from '../types';
import { RocketRideClient } from '../rocketride-client';

/**
 * RocketRide AI provider.
 *
 * Primary path: executes the `evidence-analysis.pipe` pipeline via the real
 * RocketRide SDK (WebSocket-based, OCR → PII anonymization → vector search → Gemini LLM).
 *
 * Fallback path (auto-triggered by RocketRideClient on timeout or connection failure):
 * The in-process deterministic 6-stage pipeline runs entirely locally, ensuring
 * disputes are never silently dropped even when the remote engine is unreachable.
 */
export class RocketRideProvider implements DisputeAIProvider {
  public readonly name = 'rocketride' as const;
  private client: RocketRideClient;

  constructor() {
    this.client = new RocketRideClient();
  }

  async analyzeDispute(input: DisputeAIInput): Promise<DisputeAIResult> {
    const mode = this.client.isConfigured() ? 'remote evidence-analysis pipeline' : 'in-process fallback';
    console.log(`[RocketRideProvider] Executing dispute analysis for ${input.dispute.id} via ${mode}...`);
    return await this.client.executeDisputeAnalyzer(input);
  }
}
