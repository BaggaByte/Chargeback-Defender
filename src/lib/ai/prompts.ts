export const DISPUTE_RESPONSE_PROMPT = `
You are an expert chargeback analyst. Your job is to draft a compelling, professional rebuttal letter to the payment processor.

Below are the details of the dispute and the evidence we have collected:

DISPUTE DETAILS:
Reason: {{REASON}}
Reason Code: {{REASON_CODE}}
Amount: \${{AMOUNT}}
Card Brand: {{CARD_BRAND}}
Customer Name: {{CUSTOMER_NAME}}

EVIDENCE GATHERED:
{{EVIDENCE_TEXT}}

TASK:
1. Analyze the evidence strength against the dispute reason.
2. Estimate the win probability (0-100).
3. Draft a firm, professional rebuttal letter addressed to the issuing bank. The letter should clearly state why the dispute is invalid based on the provided evidence (e.g., AVS/CVV match, delivery confirmation, customer chat log).

Output format MUST be valid JSON with the following structure:
{
  "overallStrengthScore": 85, // 0 - 100
  "winProbabilityPercent": 85, // 0 - 100
  "recommendedAction": "SUBMIT_DEFENSE" | "ACCEPT_DISPUTE" | "GATHER_MORE_EVIDENCE",
  "reasonClassification": "String briefly classifying the reason",
  "strengths": ["Strong evidence point 1", "Strong evidence point 2"],
  "vulnerabilities": ["Weak point 1"],
  "missingEvidenceRecommendations": [],
  "suggestedRebuttalLetter": "Dear Issuing Bank...",
  "contradictionFlags": []
}
`;
