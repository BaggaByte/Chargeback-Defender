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
  'OPEN',
  'EVIDENCE_COLLECTING',
  'PENDING_APPROVAL',
  'SUBMITTED',
  'WON',
  'LOST',
  'EXPIRED',
]);
export const EvidenceType = pgEnum('evidence_type', [
  'ORDER_DETAILS',
  'SHIPPING_PROOF',
  'CUSTOMER_COMMUNICATION',
  'TOS_AGREEMENT',
  'OTHER',
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

export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  orderId: uuid('order_id')
    .references(() => orders.id)
    .notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
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
