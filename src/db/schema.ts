import {
  pgTable,
  text,
  timestamp,
  numeric,
  uuid,
  varchar,
  pgEnum,
  integer,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';

export const UserRole = pgEnum('user_role', ['ADMIN', 'MANAGER', 'OPERATOR']);
export const DisputeStatus = pgEnum('dispute_status', [
  'RECEIVED',
  'PROCESSING',
  'EVIDENCE_READY',
  'AI_ANALYZED',
  'NEEDS_REVIEW',
  'APPROVED',
  'REJECTED',
  'SUBMITTED',
  'RESOLVED',
  'FAILED',
  'OPEN',
  'EVIDENCE_COLLECTING',
  'PENDING_APPROVAL',
  'WON',
  'LOST',
  'EXPIRED',
]);
export const EvidenceType = pgEnum('evidence_type', [
  'ORDER_DETAILS',
  'SHIPPING_PROOF',
  'CUSTOMER_COMMUNICATION',
  'TOS_AGREEMENT',
  'TRIP_GPS_LOG',
  'RIDE_COMPLETION_CONFIRMATION',
  'DRIVER_VERIFICATION',
  'RIDER_SESSION_CORRELATION',
  'OTHER',
]);

export const MarketplaceLiabilityType = pgEnum('marketplace_liability_type', [
  'PLATFORM',
  'DRIVER',
  'SPLIT',
  'UNDETERMINED',
]);

export const DriverStatus = pgEnum('driver_status', [
  'ONBOARDING',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
]);

export const RideStatus = pgEnum('ride_status', [
  'REQUESTED',
  'ACCEPTED',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  settings: jsonb('settings').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: UserRole('role').default('OPERATOR').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 50 }),
  address: text('address'),
  profileData: jsonb('profile_data').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  customerId: uuid('customer_id')
    .references(() => customers.id)
    .notNull(),
  externalOrderId: varchar('external_order_id', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  orderData: jsonb('order_data').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
});

export const connectedAccounts = pgTable('connected_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  stripeAccountId: varchar('stripe_account_id', { length: 255 }).unique().notNull(),
  accountType: varchar('account_type', { length: 50 }).default('express').notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  country: varchar('country', { length: 2 }).default('US').notNull(),
  defaultCurrency: varchar('default_currency', { length: 3 }).default('USD').notNull(),
  detailsSubmitted: boolean('details_submitted').default(false).notNull(),
  chargesEnabled: boolean('charges_enabled').default(false).notNull(),
  payoutsEnabled: boolean('payouts_enabled').default(false).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  requirements: jsonb('requirements').$type<Record<string, unknown>>(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const drivers = pgTable('drivers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  connectedAccountId: uuid('connected_account_id')
    .references(() => connectedAccounts.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }),
  licenseNumber: varchar('license_number', { length: 100 }),
  vehicleMake: varchar('vehicle_make', { length: 100 }),
  vehicleModel: varchar('vehicle_model', { length: 100 }),
  vehicleYear: integer('vehicle_year'),
  vehiclePlate: varchar('vehicle_plate', { length: 50 }),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('5.00').notNull(),
  totalCompletedTrips: integer('total_completed_trips').default(0).notNull(),
  status: DriverStatus('status').default('ONBOARDING').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const riders = pgTable('riders', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('5.00').notNull(),
  totalRidesCount: integer('total_rides_count').default(0).notNull(),
  fraudRiskScore: integer('fraud_risk_score').default(0).notNull(),
  defaultPaymentMethodId: varchar('default_payment_method_id', { length: 255 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rides = pgTable('rides', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  driverId: uuid('driver_id')
    .references(() => drivers.id)
    .notNull(),
  riderId: uuid('rider_id')
    .references(() => riders.id)
    .notNull(),
  orderId: uuid('order_id').references(() => orders.id),
  status: RideStatus('status').default('REQUESTED').notNull(),
  pickupAddress: text('pickup_address').notNull(),
  pickupLatitude: numeric('pickup_latitude', { precision: 10, scale: 7 }).notNull(),
  pickupLongitude: numeric('pickup_longitude', { precision: 10, scale: 7 }).notNull(),
  pickupTimestamp: timestamp('pickup_timestamp'),
  dropoffAddress: text('dropoff_address').notNull(),
  dropoffLatitude: numeric('dropoff_latitude', { precision: 10, scale: 7 }).notNull(),
  dropoffLongitude: numeric('dropoff_longitude', { precision: 10, scale: 7 }).notNull(),
  dropoffTimestamp: timestamp('dropoff_timestamp'),
  fareAmount: numeric('fare_amount', { precision: 10, scale: 2 }).notNull(),
  platformFee: numeric('platform_fee', { precision: 10, scale: 2 }).notNull(),
  driverEarnings: numeric('driver_earnings', { precision: 10, scale: 2 }).notNull(),
  tipAmount: numeric('tip_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  distanceMiles: numeric('distance_miles', { precision: 6, scale: 2 }),
  durationMinutes: integer('duration_minutes'),
  routePolylineHash: varchar('route_polyline_hash', { length: 255 }),
  otpVerified: boolean('otp_verified').default(false).notNull(),
  stripeChargeId: varchar('stripe_charge_id', { length: 255 }),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  stripeTransferId: varchar('stripe_transfer_id', { length: 255 }),
  telemetry: jsonb('telemetry').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  connectedAccountId: uuid('connected_account_id')
    .references(() => connectedAccounts.id)
    .notNull(),
  driverId: uuid('driver_id')
    .references(() => drivers.id)
    .notNull(),
  stripeTransferId: varchar('stripe_transfer_id', { length: 255 }).unique().notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  status: varchar('status', { length: 50 }).default('paid').notNull(),
  reversedAmount: numeric('reversed_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  orderId: uuid('order_id')
    .references(() => orders.id)
    .notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  connectedAccountId: uuid('connected_account_id').references(() => connectedAccounts.id),
  rideId: uuid('ride_id').references(() => rides.id),
  liabilityType: MarketplaceLiabilityType('liability_type').default('UNDETERMINED'),
  driverLiabilityAmount: numeric('driver_liability_amount', { precision: 10, scale: 2 }).default('0.00'),
  platformLiabilityAmount: numeric('platform_liability_amount', { precision: 10, scale: 2 }).default('0.00'),
  transferReversalId: varchar('transfer_reversal_id', { length: 255 }),
  externalDisputeId: varchar('external_dispute_id', { length: 255 }).notNull(),
  processorDisputeId: varchar('processor_dispute_id', { length: 255 }),
  processor: varchar('processor', { length: 50 }).notNull(),
  reason: text('reason').notNull(),
  reasonCode: varchar('reason_code', { length: 50 }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  feeAmount: numeric('fee_amount', { precision: 10, scale: 2 }).default('15.00'),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  status: DisputeStatus('status').default('OPEN').notNull(),
  deadline: timestamp('deadline').notNull(),
  riskLevel: varchar('risk_level', { length: 20 }).default('MEDIUM'),
  cardBrand: varchar('card_brand', { length: 20 }),
  cardLast4: varchar('card_last4', { length: 4 }),
  cardholderName: varchar('cardholder_name', { length: 255 }),
  evidenceStrengthScore: integer('evidence_strength_score').default(0),
  winProbability: integer('win_probability').default(0),
  rebuttalLetter: text('rebuttal_letter'),
  rebuttalTone: varchar('rebuttal_tone', { length: 20 }).default('firm'),
  approvedByUserId: uuid('approved_by_user_id').references(() => users.id),
  approvedByUserName: varchar('approved_by_user_name', { length: 255 }),
  approvalNotes: text('approval_notes'),
  approvedAt: timestamp('approved_at'),
  submittedAt: timestamp('submitted_at'),
  aiAnalysis: jsonb('ai_analysis').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

export const evidence = pgTable('evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  disputeId: uuid('dispute_id')
    .references(() => disputes.id)
    .notNull(),
  type: EvidenceType('type').notNull(),
  content: text('content').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  sourceIntegration: varchar('source_integration', { length: 100 }).default('Manual Upload'),
  isAutoCollected: boolean('is_auto_collected').default(false).notNull(),
  confidenceScore: integer('confidence_score').default(85),
  isIncludedInSubmission: boolean('is_included_in_submission').default(true).notNull(),
  fileUrl: text('file_url'),
  fileSize: varchar('file_size', { length: 50 }),
  fileType: varchar('file_type', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  userId: uuid('user_id').references(() => users.id),
  userName: varchar('user_name', { length: 255 }),
  userRole: varchar('user_role', { length: 50 }),
  action: varchar('action', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 255 }).notNull(),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 50 }).default('127.0.0.1'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  processor: varchar('processor', { length: 50 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  category: varchar('category', { length: 50 }).default('PAYMENT_PROCESSOR'),
  apiKey: text('api_key'),
  webhookSecret: text('webhook_secret'),
  webhookUrl: text('webhook_url'),
  status: varchar('status', { length: 50 }).default('connected').notNull(),
  lastSyncAt: timestamp('last_sync_at'),
  syncedDisputesCount: integer('synced_disputes_count').default(0),
  config: jsonb('config').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 50 }).default('info').notNull(),
  read: boolean('read').default(false).notNull(),
  linkUrl: text('link_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * stripe_events — database-enforced webhook idempotency table.
 *
 * Every incoming Stripe webhook event is recorded here BEFORE any business
 * logic runs. Because stripe_event_id carries a UNIQUE constraint, a second
 * delivery of the same event will fail the INSERT and we return 200 without
 * reprocessing.
 *
 * status values:
 *   'processing' — INSERT succeeded, handler is running
 *   'processed'  — handler completed successfully
 *   'failed'     — handler threw an error (error column populated)
 */
export const stripeEvents = pgTable('stripe_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  stripeEventId: varchar('stripe_event_id', { length: 255 }).unique().notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).default('processing').notNull(),
  error: text('error'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

