import { DisputeAIInput, DisputeAIProvider, DisputeAIResult } from './types';
import { RocketRideProvider } from './providers/rocketride-provider';
import { GeminiProvider } from './providers/gemini-provider';

/**
 * Resolves the primary configured AI provider.
 */
export function getAIProvider(providerName?: string): DisputeAIProvider {
  const chosen = (providerName || process.env.AI_PROVIDER || 'rocketride').toLowerCase();

  switch (chosen) {
    case 'gemini':
      return new GeminiProvider();
    case 'rocketride':
    default:
      return new RocketRideProvider();
  }
}

/**
 * Executes dispute analysis using the configured provider with explicit, observable fallback handling.
 */
export async function executeDisputeAnalysis(input: DisputeAIInput): Promise<DisputeAIResult> {
  const configuredProviderName = (process.env.AI_PROVIDER || 'rocketride').toLowerCase();
  const fallbackProviderName = process.env.AI_FALLBACK_PROVIDER?.toLowerCase();

  const primaryProvider = getAIProvider(configuredProviderName);

  try {
    const result = await primaryProvider.analyzeDispute(input);
    return result;
  } catch (primaryError: any) {
    console.error(`[AI Execution] Primary provider '${configuredProviderName}' failed:`, primaryError.message);

    // Explicit, observable fallback if configured
    if (fallbackProviderName && fallbackProviderName !== configuredProviderName) {
      console.warn(
        `[AI Execution] Triggering observable fallback to '${fallbackProviderName}' as configured by AI_FALLBACK_PROVIDER.`
      );
      const fallbackProvider = getAIProvider(fallbackProviderName);
      try {
        const fallbackResult = await fallbackProvider.analyzeDispute(input);
        fallbackResult.fallbackUsed = true;
        fallbackResult.fallbackReason = `Primary provider '${configuredProviderName}' failed: ${primaryError.message}`;
        return fallbackResult;
      } catch (fallbackError: any) {
        console.error(`[AI Execution] Fallback provider '${fallbackProviderName}' also failed:`, fallbackError.message);
        throw new Error(
          `AI Analysis failed on primary provider (${configuredProviderName}) and fallback (${fallbackProviderName}).`
        );
      }
    }

    throw primaryError;
  }
}
