import { DisputeRecord, EvidenceItem, CustomerProfileData, OrderDetailData } from '@/lib/types';

/**
 * Structured, sanitized input for dispute AI analysis.
 * Contains only the data necessary to analyze the dispute and draft a factual rebuttal.
 */
export interface DisputeAIInput {
  dispute: {
    id: string;
    externalDisputeId: string;
    processorDisputeId?: string;
    processor: string;
    amount: number;
    feeAmount?: number;
    currency: string;
    reason: string;
    reasonCode?: string;
    cardBrand: string;
    cardLast4: string;
    cardholderName: string;
    deadline?: string;
    createdAt?: string;
  };
  customer?: {
    id?: string;
    email?: string;
    name?: string;
    totalOrdersCount?: number;
    lifetimeValue?: number;
    fraudRiskScore?: number;
    accountCreatedAt?: string;
    hasAcceptedTos?: boolean;
    tosVersion?: string;
  };
  transaction?: {
    id?: string;
    externalOrderId?: string;
    amount?: number;
    currency?: string;
    carrier?: string;
    trackingNumber?: string;
    carrierStatus?: string;
    deliveredAt?: string;
    deliverySignature?: string;
    avsResult?: string;
    cvcResult?: string;
    threeDSecure?: string;
    createdAt?: string;
  };
  evidence: Array<{
    id?: string;
    type: string;
    title: string;
    content: string;
    sourceIntegration?: string;
    confidenceScore?: number;
    isIncludedInSubmission?: boolean;
  }>;
}

/**
 * Individual evidence item analysis result.
 */
export interface EvidenceItemAnalysis {
  id?: string;
  type: string;
  title: string;
  relevance: 'HIGH' | 'MEDIUM' | 'LOW';
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  supportingFacts: string[];
  contradictions: string[];
  missingInfo?: string;
}

/**
 * Missing evidence recommendation.
 */
export interface MissingEvidenceRecommendation {
  type?: string;
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  importance?: 'high' | 'medium' | 'low';
}

/**
 * Anti-hallucination verification report.
 */
export interface AIVerificationReport {
  passed: boolean;
  unsupportedClaims: string[];
  contradictions: string[];
  addressedDisputeReason: boolean;
  internallyConsistent: boolean;
  notes?: string;
}

/**
 * Normalized result from any AI provider (RocketRide, Gemini, Heuristic).
 */
export interface DisputeAIResult {
  overallStrengthScore: number; // 0 - 100
  winProbabilityPercent: number; // 0 - 100
  confidence: number; // 0.0 - 1.0
  recommendedAction: 'SUBMIT_DEFENSE' | 'ACCEPT_DISPUTE' | 'GATHER_MORE_EVIDENCE';
  reasonClassification: string;
  applicableCompellingEvidenceRule?: string;
  strengths: string[];
  vulnerabilities: string[];
  missingEvidenceRecommendations: MissingEvidenceRecommendation[];
  riskFlags?: string[];
  suggestedRebuttalLetter: string;
  contradictionFlags: string[];

  // Evidence Evaluation
  evidenceAnalysis?: EvidenceItemAnalysis[];

  // Anti-hallucination verification
  verification: AIVerificationReport;

  // Execution Metadata
  provider: 'rocketride' | 'gemini' | 'heuristic';
  pipeline: string;
  analyzedAt: string;
  executionMode?: 'remote_cluster' | 'in_process_fallback';
  isLiveExecution?: boolean;
  fallbackUsed?: boolean;
  fallbackReason?: string;
}

/**
 * Deployment response when uploading or verifying a .pipe pipeline.
 */
export interface RocketRideDeploymentResult {
  status: 'success' | 'failed';
  deploymentId: string;
  pipelineName: string;
  version: string;
  nodesCount: number;
  isRemote: boolean;
  endpoint: string;
  timestamp: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Health and connectivity status of the RocketRide engine.
 */
export interface RocketRideClusterStatus {
  configured: boolean;
  endpoint: string;
  status: 'ready' | 'in_process_fallback' | 'unreachable' | 'not_configured';
  latencyMs?: number;
  serverVersion?: string;
  capabilities?: string[];
  lastChecked: string;
}

/**
 * Common interface for Dispute AI Providers.
 */
export interface DisputeAIProvider {
  readonly name: 'rocketride' | 'gemini' | 'heuristic';
  analyzeDispute(input: DisputeAIInput): Promise<DisputeAIResult>;
}

/**
 * Helper to build a clean DisputeAIInput from existing DisputeRecord.
 */
export function buildDisputeAIInput(dispute: DisputeRecord): DisputeAIInput {
  return {
    dispute: {
      id: dispute.id,
      externalDisputeId: dispute.externalDisputeId,
      processorDisputeId: dispute.processorDisputeId,
      processor: dispute.processor,
      amount: dispute.amount,
      feeAmount: dispute.feeAmount,
      currency: dispute.currency,
      reason: dispute.reason,
      reasonCode: dispute.reasonCode,
      cardBrand: dispute.cardBrand,
      cardLast4: dispute.cardLast4,
      cardholderName: dispute.cardholderName,
      deadline: dispute.deadline,
      createdAt: dispute.createdAt,
    },
    customer: dispute.customer
      ? {
          id: dispute.customer.id,
          email: dispute.customer.email,
          name: dispute.customer.name,
          totalOrdersCount: dispute.customer.totalOrdersCount,
          lifetimeValue: dispute.customer.lifetimeValue,
          fraudRiskScore: dispute.customer.fraudRiskScore,
          accountCreatedAt: dispute.customer.accountCreatedAt,
          hasAcceptedTos: dispute.customer.hasAcceptedTos,
          tosVersion: dispute.customer.tosVersion,
        }
      : undefined,
    transaction: dispute.order
      ? {
          id: dispute.order.id,
          externalOrderId: dispute.order.externalOrderId,
          amount: dispute.order.amount,
          currency: dispute.order.currency,
          carrier: dispute.order.carrier,
          trackingNumber: dispute.order.trackingNumber,
          carrierStatus: dispute.order.carrierStatus,
          deliveredAt: dispute.order.deliveredAt,
          deliverySignature: dispute.order.deliverySignature,
          avsResult: dispute.order.avsResult,
          cvcResult: dispute.order.cvcResult,
          threeDSecure: dispute.order.threeDSecure,
          createdAt: dispute.order.createdAt,
        }
      : undefined,
    evidence: (dispute.evidenceList || []).map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      content: e.content,
      sourceIntegration: e.sourceIntegration,
      confidenceScore: e.confidenceScore,
      isIncludedInSubmission: e.isIncludedInSubmission,
    })),
  };
}
