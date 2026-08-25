import { DisputeRecord, EvidenceItem } from "@/lib/types";

export interface ScoreBreakdown {
  rule: string;
  points: number;
}

export interface ScoringResult {
  score: number;
  breakdown: ScoreBreakdown[];
}

export function calculateEvidenceScore(dispute: DisputeRecord, evidence: EvidenceItem[]): ScoringResult {
  let totalScore = 10; // Base score
  const breakdown: ScoreBreakdown[] = [
    { rule: 'Base Score', points: 10 }
  ];

  // 1. Evidence Types
  const hasShipping = evidence.some(e => e.type === 'SHIPPING_PROOF');
  if (hasShipping) {
    totalScore += 30;
    breakdown.push({ rule: 'Valid Shipping/Delivery Proof', points: 30 });
  }

  const hasOrderDetails = evidence.some(e => e.type === 'ORDER_DETAILS');
  if (hasOrderDetails) {
    totalScore += 15;
    breakdown.push({ rule: 'Order Details & Invoice', points: 15 });
  }

  const hasCommunication = evidence.some(e => e.type === 'CUSTOMER_COMMUNICATION' || e.type === 'ACTIVITY_LOGS');
  if (hasCommunication) {
    totalScore += 20;
    breakdown.push({ rule: 'Customer Communication / IP Logs', points: 20 });
  }

  const hasTos = evidence.some(e => e.type === 'TOS_AGREEMENT');
  if (hasTos) {
    totalScore += 10;
    breakdown.push({ rule: 'TOS/Refund Policy Agreement', points: 10 });
  }

  // 2. Order Metadata (AVS/CVC)
  if (dispute.order) {
    if (dispute.order.avsResult === 'MATCH') {
      totalScore += 10;
      breakdown.push({ rule: 'Address Verification (AVS) Match', points: 10 });
    }
    if (dispute.order.cvcResult === 'MATCH') {
      totalScore += 5;
      breakdown.push({ rule: 'CVC Match', points: 5 });
    }
    if (dispute.order.threeDSecure === 'AUTHENTICATED') {
      totalScore += 15;
      breakdown.push({ rule: '3D-Secure Authenticated', points: 15 });
    }
  }

  // Cap at 100
  if (totalScore > 100) {
    const diff = totalScore - 100;
    totalScore = 100;
    breakdown.push({ rule: 'Score Capped at 100', points: -diff });
  }

  return {
    score: totalScore,
    breakdown
  };
}
