import { AIAnalysisReport, DisputeRecord } from '@/lib/types';
import { AIEngine } from '@/lib/ai/engine';

export class RocketRideExecutionClient {
  private apiKey: string;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.ROCKETRIDE_API_KEY || '';
    this.endpoint = process.env.ROCKETRIDE_ENDPOINT || 'https://api.rocketride.ai:443';
  }

  /**
   * Triggers the RocketRide engine pipeline for chargeback defense.
   * If the real API key is missing or the endpoint is unreachable, gracefully falls back
   * to the local AIEngine (Gemini/Mock) to ensure the demo does not crash.
   */
  async executePipeline(pipelineName: string, dispute: DisputeRecord): Promise<AIAnalysisReport> {
    console.log(`[RocketRideClient] Executing pipeline '${pipelineName}' for dispute ${dispute.id}...`);

    let evidenceText = '';
    if (dispute.evidenceList && dispute.evidenceList.length > 0) {
      evidenceText = dispute.evidenceList.map(e => `[${e.type}] ${e.title}\n${e.content}`).join('\n\n');
    } else {
      evidenceText = 'No automated evidence collected yet.';
    }

    const payload = {
      pipeline: pipelineName,
      inputs: {
        dispute_id: dispute.id,
        reason: dispute.reason,
        reason_code: dispute.reasonCode,
        amount: dispute.amount,
        currency: dispute.currency,
        card_brand: dispute.cardBrand,
        customer_name: dispute.cardholderName,
        evidence: evidenceText,
      }
    };

    if (this.apiKey && this.apiKey !== 'sk_rr_test_mock123') {
      try {
        console.log(`[RocketRideClient] Calling live RocketRide engine at ${this.endpoint}/v1/pipelines/execute...`);
        const response = await fetch(`${this.endpoint}/v1/pipelines/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          // Assume RocketRide returns the exact JSON matching AIAnalysisReport (from the response_json node)
          if (data && data.result) {
            console.log('[RocketRideClient] Successfully received structured result from RocketRide engine.');
            return data.result as AIAnalysisReport;
          }
        } else {
          console.error(`[RocketRideClient] Engine returned status ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('[RocketRideClient] Failed to execute live RocketRide pipeline. Falling back to local engine.', error);
      }
    } else {
      console.warn('[RocketRideClient] No active ROCKETRIDE_API_KEY found. Falling back to local/mock execution engine.');
    }

    // Fallback behavior: run the local AIEngine (which uses Gemini, or falls back to mock)
    const localEngine = new AIEngine();
    return await localEngine.analyzeDispute(dispute);
  }
}
