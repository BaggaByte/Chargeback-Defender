import type { DisputeStatus } from './dispute-state-machine';

export type DisputeStatusType = DisputeStatus;

export type EvidenceCategory =
  | 'ORDER_DETAILS'
  | 'SHIPPING_PROOF'
  | 'CUSTOMER_COMMUNICATION'
  | 'TOS_AGREEMENT'
  | 'IDENTITY_VERIFICATION'
  | 'ACTIVITY_LOGS'
  | 'REFUND_POLICY'
  | 'TRIP_GPS_LOG'
  | 'RIDE_COMPLETION_CONFIRMATION'
  | 'DRIVER_VERIFICATION'
  | 'RIDER_SESSION_CORRELATION'
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
  confidence?: number; // 0.0 - 1.0
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
  provider?: string;
  pipeline?: string;
  executionMode?: 'remote_cluster' | 'in_process_fallback';
  isLiveExecution?: boolean;
  verification?: {
    passed: boolean;
    unsupportedClaims: string[];
    contradictions: string[];
    addressedDisputeReason: boolean;
    internallyConsistent: boolean;
    notes?: string;
  };
  fallbackUsed?: boolean;
  fallbackReason?: string;
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

  // Marketplace & Connect Attributes
  connectedAccountId?: string;
  rideId?: string;
  liabilityType?: MarketplaceLiabilityType;
  driverLiabilityAmount?: number;
  platformLiabilityAmount?: number;
  transferReversalId?: string;
  
  // Relations
  customer?: CustomerProfileData;
  order?: OrderDetailData;
  evidenceList?: EvidenceItem[];
  aiAnalysis?: AIAnalysisReport;
  ride?: RideRecord;
  connectedAccount?: ConnectedAccountRecord;
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

export type MarketplaceLiabilityType = 'PLATFORM' | 'DRIVER' | 'SPLIT' | 'UNDETERMINED';

export interface ConnectedAccountRecord {
  id: string;
  organizationId: string;
  stripeAccountId: string;
  accountType: 'express' | 'custom' | 'standard';
  email: string;
  country: string;
  defaultCurrency: string;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  status: 'pending' | 'active' | 'restricted' | 'disabled';
  requirements?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface DriverRecord {
  id: string;
  organizationId: string;
  connectedAccountId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  licenseNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehiclePlate?: string;
  rating: number;
  totalCompletedTrips: number;
  status: 'ONBOARDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  connectedAccount?: ConnectedAccountRecord;
}

export interface RiderRecord {
  id: string;
  organizationId: string;
  customerId?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  rating: number;
  totalRidesCount: number;
  fraudRiskScore: number;
  defaultPaymentMethodId?: string;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface RideRecord {
  id: string;
  organizationId: string;
  driverId: string;
  riderId: string;
  orderId?: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupTimestamp?: string;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  dropoffTimestamp?: string;
  fareAmount: number;
  platformFee: number;
  driverEarnings: number;
  tipAmount: number;
  currency: string;
  distanceMiles?: number;
  durationMinutes?: number;
  routePolylineHash?: string;
  otpVerified: boolean;
  stripeChargeId?: string;
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
  telemetry?: {
    geofenceProximityMeters?: number;
    destinationReached?: boolean;
    riderDeviceIp?: string;
    riderAppSessionId?: string;
    driverAppSessionId?: string;
    speedTelemetricsValid?: boolean;
    routeDeviationFlag?: boolean;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  driver?: DriverRecord;
  rider?: RiderRecord;
}

export interface PayoutRecord {
  id: string;
  organizationId: string;
  connectedAccountId: string;
  driverId: string;
  stripeTransferId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'reversed';
  reversedAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceLiabilityEvaluation {
  liability: MarketplaceLiabilityType;
  driverSharePercent: number;
  platformSharePercent: number;
  driverLiabilityAmount: number;
  platformLiabilityAmount: number;
  reversalRequired: boolean;
  reversalAmount: number;
  confidenceScore: number;
  reasoning: string[];
  recommendedAction: 'DEFEND_COMPENSATE' | 'REVERSE_DRIVER_TRANSFER' | 'ABSORB_PLATFORM_LOSS' | 'SPLIT_LIABILITY';
}
