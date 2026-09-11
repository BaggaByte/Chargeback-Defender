import { GoogleGenAI } from '@google/genai';
import { DisputeAIInput, DisputeAIProvider, DisputeAIResult } from '../types';
import { verifyGeneratedRebuttal } from '../verification';

export class GeminiProvider implements DisputeAIProvider {
  public readonly name = 'gemini' as const;
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.aiClient = new GoogleGenAI({ apiKey });
    }
  }

  async analyzeDispute(input: DisputeAIInput): Promise<DisputeAIResult> {
    console.log(`[GeminiProvider] Analyzing dispute ${input.dispute.id}...`);

    const evidenceSummary =
      input.evidence.map((e) => `- [${e.type}] ${e.title}: ${e.content}`).join('\n') ||
      'No evidence attached.';

    const prompt = `You are an elite chargeback defense specialist.
Analyze this payment dispute and return a strictly validated JSON object.
Do NOT invent unverified facts, tracking numbers, or dates not provided in the input.

Dispute Details:
- ID: ${input.dispute.externalDisputeId}
- Card: ${input.dispute.cardBrand.toUpperCase()} ending in ${input.dispute.cardLast4}
- Processor: ${input.dispute.processor.toUpperCase()}
- Disputed Amount: $${input.dispute.amount.toFixed(2)} ${input.dispute.currency}
- Reason: ${input.dispute.reason}
- Cardholder: ${input.dispute.cardholderName}

Order / Transaction Details:
- External Order ID: ${input.transaction?.externalOrderId || 'N/A'}
- Carrier Status: ${input.transaction?.carrierStatus || 'N/A'}
- Carrier Tracking: ${input.transaction?.trackingNumber || 'N/A'}
- 3D Secure: ${input.transaction?.threeDSecure || 'N/A'}
- AVS Result: ${input.transaction?.avsResult || 'N/A'} | CVC: ${input.transaction?.cvcResult || 'N/A'}

Attached Evidence:
${evidenceSummary}

Return pure JSON matching this exact structure:
{
  "overallStrengthScore": <number 0-100>,
  "winProbabilityPercent": <number 0-100>,
  "recommendedAction": "SUBMIT_DEFENSE" | "ACCEPT_DISPUTE" | "GATHER_MORE_EVIDENCE",
  "reasonClassification": "<concise reason classification>",
  "applicableCompellingEvidenceRule": "<card rule name e.g. Visa CE 3.0>",
  "strengths": ["<verified strength>"],
  "vulnerabilities": ["<vulnerability>"],
  "missingEvidenceRecommendations": [
    {
      "type": "<evidence_type>",
      "title": "<recommended evidence>",
      "impact": "HIGH" | "MEDIUM" | "LOW",
      "reason": "<why this helps>"
    }
  ],
  "suggestedRebuttalLetter": "<factual, professional, firm legal rebuttal citing ONLY facts provided above>"
}`;

    if (this.aiClient) {
      try {
        const response = await this.aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          const rebuttal = parsed.suggestedRebuttalLetter || '';
          const verification = verifyGeneratedRebuttal(input, rebuttal, parsed.strengths || []);

          return {
            overallStrengthScore: parsed.overallStrengthScore || 75,
            winProbabilityPercent: parsed.winProbabilityPercent || 70,
            confidence: 0.88,
            recommendedAction: parsed.recommendedAction || 'SUBMIT_DEFENSE',
            reasonClassification: parsed.reasonClassification || input.dispute.reason,
            applicableCompellingEvidenceRule: parsed.applicableCompellingEvidenceRule || 'Card Network Compelling Evidence Standard',
            strengths: parsed.strengths || [],
            vulnerabilities: parsed.vulnerabilities || [],
            missingEvidenceRecommendations: parsed.missingEvidenceRecommendations || [],
            riskFlags: parsed.vulnerabilities || [],
            suggestedRebuttalLetter: rebuttal,
            contradictionFlags: verification.contradictions,
            verification,
            provider: 'gemini',
            pipeline: 'gemini-2.5-flash',
            analyzedAt: new Date().toISOString(),
            executionMode: 'remote_cluster',
            isLiveExecution: true,
          };
        }
      } catch (err: any) {
        console.warn('[GeminiProvider] Live Gemini API call failed, using heuristic fallback:', err.message);
      }
    }

    // Fallback: Deterministic heuristic response
    return this.executeHeuristicFallback(input);
  }

  private executeHeuristicFallback(input: DisputeAIInput): DisputeAIResult {
    const { dispute, transaction, evidence } = input;
    const has3DS = transaction?.threeDSecure === 'AUTHENTICATED';
    const isDelivered = transaction?.carrierStatus === 'DELIVERED';
    const hasShipping = evidence.some((e) => e.type === 'SHIPPING_PROOF');

    let strength = 70;
    let winProb = 65;
    const strengths: string[] = [];
    const vulnerabilities: string[] = [];

    if (has3DS) {
      strength += 15;
      winProb += 15;
      strengths.push('3D-Secure 2.0 liability shift on file');
    }
    if (hasShipping && isDelivered) {
      strength += 10;
      winProb += 10;
      strengths.push('Carrier delivery confirmation on record');
    }

    const rebuttal = `FORMAL CHARGEBACK REPRESENTMENT NOTICE
Merchant: Acme SaaS Corp
Case ID: ${dispute.externalDisputeId} | Amount: $${dispute.amount.toFixed(2)} ${dispute.currency}
Cardholder: ${dispute.cardholderName} (${dispute.cardBrand.toUpperCase()} ****${dispute.cardLast4})

SUMMARY OF DEFENSE:
The cardholder filed for "${dispute.reason}". The transaction completed full authorization and authentication. The merchant fulfilled all order obligations in accordance with published terms. We respectfully request reversal of this dispute.`;

    const verification = verifyGeneratedRebuttal(input, rebuttal, strengths);

    return {
      overallStrengthScore: Math.min(95, strength),
      winProbabilityPercent: Math.min(92, winProb),
      confidence: 0.85,
      recommendedAction: strength > 60 ? 'SUBMIT_DEFENSE' : 'GATHER_MORE_EVIDENCE',
      reasonClassification: dispute.reason,
      applicableCompellingEvidenceRule: 'Standard Merchant Card Brand Representment Framework',
      strengths,
      vulnerabilities,
      missingEvidenceRecommendations: [
        {
          type: 'delivery_proof',
          title: 'Direct Courier Signature Certificate',
          impact: 'HIGH',
          importance: 'high',
          reason: 'Solidifies physical receipt by cardholder.',
        },
      ],
      riskFlags: vulnerabilities,
      suggestedRebuttalLetter: rebuttal,
      contradictionFlags: verification.contradictions,
      verification,
      provider: 'gemini',
      pipeline: 'gemini-heuristic-fallback',
      analyzedAt: new Date().toISOString(),
      executionMode: 'in_process_fallback',
      isLiveExecution: false,
      fallbackUsed: true,
      fallbackReason: 'Gemini API key not configured or call timed out',
    };
  }
}
