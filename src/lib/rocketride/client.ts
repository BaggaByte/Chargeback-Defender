import { AIAnalysisReport, DisputeRecord } from '@/lib/types';
import { executeDisputeAnalysis } from '@/lib/ai/provider-factory';
import { buildDisputeAIInput } from '@/lib/ai/types';

export class RocketRideExecutionClient {
  /**
   * Executes the dispute analyzer pipeline via the centralized provider architecture.
   */
  async executePipeline(pipelineName: string, dispute: DisputeRecord): Promise<AIAnalysisReport> {
    console.log(`[RocketRideClient] Delegating pipeline '${pipelineName}' for dispute ${dispute.id} to executeDisputeAnalysis...`);
    const input = buildDisputeAIInput(dispute);
    const result = await executeDisputeAnalysis(input);
    return result as unknown as AIAnalysisReport;
  }
}
