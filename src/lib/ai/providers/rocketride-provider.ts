import { DisputeAIInput, DisputeAIProvider, DisputeAIResult } from '../types';
import { RocketRideClient } from '../rocketride-client';

export class RocketRideProvider implements DisputeAIProvider {
  public readonly name = 'rocketride' as const;
  private client: RocketRideClient;

  constructor() {
    this.client = new RocketRideClient();
  }

  async analyzeDispute(input: DisputeAIInput): Promise<DisputeAIResult> {
    console.log(`[RocketRideProvider] Executing dispute analysis for ${input.dispute.id}...`);
    return await this.client.executeDisputeAnalyzer(input);
  }
}
