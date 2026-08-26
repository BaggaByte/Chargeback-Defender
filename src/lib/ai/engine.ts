import { AIAnalysisReport, DisputeRecord } from '@/lib/types';
import { DISPUTE_RESPONSE_PROMPT } from './prompts';

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

    // Simulate AI reasoning delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real app we'd call OpenAI/Anthropic SDK here.
    // We mock the response for now.
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
