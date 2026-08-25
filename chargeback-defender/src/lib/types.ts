export type DisputeStatusType =
  | 'OPEN'
  | 'EVIDENCE_COLLECTING'
  | 'PENDING_APPROVAL'
  | 'SUBMITTED'
  | 'WON'
  | 'LOST'
  | 'EXPIRED';

export type EvidenceCategory =
  | 'ORDER_DETAILS'
  | 'SHIPPING_PROOF'
  | 'CUSTOMER_COMMUNICATION'
  | 'TOS_AGREEMENT'
  | 'IDENTITY_VERIFICATION'
  | 'ACTIVITY_LOGS'
  | 'REFUND_POLICY'
  | 'OTHER';

export type UserRoleType = 'SUPER_ADMIN' | 'RISK_MANAGER' | 'DISPUTE_ANALYST' | 'AUDITOR';

export type ProcessorType = 'stripe' | 'paypal' | 'adyen' | 'shopify' | 'braintree' | 'square';

export type CardBrandType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';

export interface CustomerSessionLog {
  id: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  timestamp: string;
  action: string;
  deviceFingerprint: string;
}

export interface CustomerProfileData {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  phoneNumber?: string;
  address?: string;
  totalOrdersCount: number;
  lifetimeValue: number;
  previousDisputesCount: number;
  previousDisputesWon: number;
  fraudRiskScore: number; // 0 - 100
  accountCreatedAt: string;
  lastLoginAt: string;
  sessionLogs: CustomerSessionLog[];
  hasAcceptedTos: boolean;
  tosAcceptedAt?: string;
  tosVersion?: string;
}

export interface OrderDetailData {
  id: string;
  organizationId: string;
  customerId: string;
  externalOrderId: string;
  amount: number;
  currency: string;
  status: string;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    price: number;
    type: 'physical' | 'digital' | 'subscription';
  }>;
  billingAddress: string;
  shippingAddress?: string;
  avsResult: 'MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH';
  cvcResult: 'MATCH' | 'NO_MATCH' | 'NOT_CHECKED';
  threeDSecure: 'AUTHENTICATED' | 'ATTEMPTED' | 'NOT_SUPPORTED';
  trackingNumber?: string;
  carrier?: string;
  carrierStatus?: 'DELIVERED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'EXCEPTION';
  deliverySignature?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface EvidenceItem {
  id: string;
  disputeId: string;
  type: EvidenceCategory;
  title: string;
  content: string;
  fileUrl?: string;
  fileSize?: string;
  fileType?: string;
  sourceIntegration: string; // e.g., 'Stripe API', 'FedEx Webhook', 'Zendesk CRM', 'Manual Upload'
  isAutoCollected: boolean;
  confidenceScore: number; // 0 - 100
  isIncludedInSubmission: boolean;
  verifiedAt?: string;
  createdAt: string;
}

export interface AIAnalysisReport {
  overallStrengthScore: number; // 0 - 100
  winProbabilityPercent: number; // 0 - 100
  recommendedAction: 'SUBMIT_DEFENSE' | 'ACCEPT_DISPUTE' | 'GATHER_MORE_EVIDENCE';
  reasonClassification: string;
  applicableCompellingEvidenceRule?: string; // e.g. "Visa CE 3.0 Qualified (2+ prior undisputed transactions)"
  strengths: string[];
  vulnerabilities: string[];
  missingEvidenceRecommendations: Array<{
    title: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
  }>;
  suggestedRebuttalLetter: string;
  contradictionFlags: string[];
}

export interface DisputeRecord {
  id: string;
  organizationId: string;
  orderId: string;
  customerId: string;
  externalDisputeId: string;
  processor: ProcessorType;
  processorDisputeId: string;
  reason: string;
  reasonCode: string; // e.g. "10.4", "4853", "fraudulent"
  amount: number;
  feeAmount: number;
  currency: string;
  status: DisputeStatusType;
  deadline: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cardBrand: CardBrandType;
  cardLast4: string;
  cardholderName: string;
  evidenceStrengthScore: number; // 0 - 100
  winProbability: number; // 0 - 100
  rebuttalLetter: string;
  rebuttalTone: 'firm' | 'concise' | 'detailed';
  approvedByUserId?: string;
  approvedByUserName?: string;
  approvalNotes?: string;
  approvedAt?: string;
  submittedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  customer?: CustomerProfileData;
  order?: OrderDetailData;
  evidenceList?: EvidenceItem[];
  aiAnalysis?: AIAnalysisReport;
}

export interface AuditLogRecord {
  id: string;
  organizationId: string;
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: 'DISPUTE' | 'EVIDENCE' | 'INTEGRATION' | 'ORGANIZATION' | 'USER' | 'SETTINGS';
  entityId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  organizationId: string;
  title: string;
  message: string;
  type: 'DISPUTE_NEW' | 'DEADLINE_URGENT' | 'APPROVAL_NEEDED' | 'DISPUTE_WON' | 'DISPUTE_LOST' | 'INTEGRATION_ALERT';
  severity: 'info' | 'warning' | 'critical' | 'success';
  read: boolean;
  linkUrl: string;
  createdAt: string;
}

export interface IntegrationRecord {
  id: string;
  organizationId: string;
  processor: string;
  displayName: string;
  category: 'PAYMENT_PROCESSOR' | 'ECOMMERCE' | 'SHIPPING' | 'CRM_SUPPORT' | 'ALERT_NETWORK';
  status: 'connected' | 'error' | 'syncing' | 'disconnected';
  lastSyncAt: string;
  syncedDisputesCount: number;
  webhookUrl: string;
  apiKeyMasked?: string;
  config: Record<string, any>;
}

export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  plan: 'Growth' | 'Enterprise Scale' | 'Fintech Pro';
  timezone: string;
  currency: string;
  autoPilotEnabled: boolean;
  autoPilotThreshold: number;
  defaultRebuttalTone: 'firm' | 'concise' | 'detailed';
  slaWarningHours: number;
}
