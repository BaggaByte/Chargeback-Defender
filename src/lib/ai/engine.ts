import { AIAnalysisReport, DisputeRecord } from '@/lib/types';
import { DISPUTE_RESPONSE_PROMPT } from './prompts';
import { GoogleGenAI } from '@google/genai';

export class AIEngine {
  async analyzeDispute(dispute: DisputeRecord): Promise<AIAnalysisReport> {
    console.log(`[AIEngine] Analyzing dispute ${dispute.id}...`);

    let evidenceText = '';
    if (dispute.evidenceList && dispute.evidenceList.length > 0) {
      evidenceText = dispute.evidenceList.map(e => `[${e.type}] ${e.title}\n${e.content}`).join('\n\n');
    } else {
      evidenceText = 'No automated evidence collected yet.';
    }

    const prompt = DISPUTE_RESPONSE_PROMPT
      .replace('{{REASON}}', dispute.reason)
      .replace('{{REASON_CODE}}', dispute.reasonCode)
      .replace('{{AMOUNT}}', dispute.amount.toString())
      .replace('{{CARD_BRAND}}', dispute.cardBrand)
      .replace('{{CUSTOMER_NAME}}', dispute.cardholderName)
      .replace('{{EVIDENCE_TEXT}}', evidenceText);

    // Call Gemini API if key is present
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('[AIEngine] Calling Gemini API...');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return {
            overallStrengthScore: parsed.overallStrengthScore || 50,
            winProbabilityPercent: parsed.winProbabilityPercent || 50,
            recommendedAction: parsed.recommendedAction || 'GATHER_MORE_EVIDENCE',
            reasonClassification: parsed.reasonClassification || dispute.reason,
            strengths: parsed.strengths || [],
            vulnerabilities: parsed.vulnerabilities || [],
            missingEvidenceRecommendations: parsed.missingEvidenceRecommendations || [],
            suggestedRebuttalLetter: parsed.suggestedRebuttalLetter || 'Dear Issuing Bank, ...',
            contradictionFlags: parsed.contradictionFlags || [],
          };
        }
      } catch (error) {
        console.error('[AIEngine] Gemini API call failed, falling back to mock:', error);
      }
    } else {
      console.warn('[AIEngine] GEMINI_API_KEY not found. Using mock AI response.');
    }

    // Simulate AI reasoning delay for mock
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockWinProbability = evidenceText.length > 100 ? 88 : 45;
    
    const mockRebuttal = `Dear Issuing Bank,

We are submitting evidence to refute the chargeback (Reason Code: ${dispute.reasonCode}) for $${dispute.amount.toFixed(2)} filed by ${dispute.cardholderName}. 

The customer claims the charge was invalid due to "${dispute.reason}". However, our records demonstrate the transaction was fully authorized, verified, and goods were delivered.

Evidence highlights:
- Delivery Confirmation and Signature captured.
- AVS and CVV matched during the original transaction.
- Customer support logs indicate dissatisfaction, not fraud.

We kindly ask you to reverse this dispute based on the enclosed evidence.

Sincerely,
Acme SaaS Merchant Team`;

    return {
      overallStrengthScore: mockWinProbability,
      winProbabilityPercent: mockWinProbability,
      recommendedAction: 'SUBMIT_DEFENSE',
      reasonClassification: dispute.reason,
      strengths: ['Delivery confirmation', 'AVS match'],
      vulnerabilities: ['No previous order history'],
      missingEvidenceRecommendations: [],
      suggestedRebuttalLetter: mockRebuttal,
      contradictionFlags: [],
    };
  }
}
