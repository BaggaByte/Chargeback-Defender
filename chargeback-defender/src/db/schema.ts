import { pgTable, text, timestamp, numeric, uuid, varchar, pgEnum, integer, boolean } from 'drizzle-orm/pg-core';

export const UserRole = pgEnum('user_role', ['ADMIN', 'MANAGER', 'OPERATOR']);
export const DisputeStatus = pgEnum('dispute_status', ['OPEN', 'EVIDENCE_COLLECTING', 'PENDING_APPROVAL', 'SUBMITTED', 'WON', 'LOST', 'EXPIRED']);
export const EvidenceType = pgEnum('evidence_type', ['ORDER_DETAILS', 'SHIPPING_PROOF', 'CUSTOMER_COMMUNICATION', 'TOS_AGREEMENT', 'OTHER']);

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: UserRole('role').default('OPERATOR').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  externalOrderId: varchar('external_order_id', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
});

export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  externalDisputeId: varchar('external_dispute_id', { length: 255 }).notNull(),
  processor: varchar('processor', { length: 50 }).notNull(), // e.g., 'stripe', 'paypal'
  reason: text('reason').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  status: DisputeStatus('status').default('OPEN').notNull(),
  deadline: timestamp('deadline').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

export const evidence = pgTable('evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  disputeId: uuid('dispute_id').references(() => disputes.id).notNull(),
  type: EvidenceType('type').notNull(),
  content: text('content').notNull(), // Link to file or text content
  title: varchar('title', { length: 255 }).notNull(),
  isAutoCollected: boolean('is_auto_collected').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  processor: varchar('processor', { length: 50 }).notNull(),
  apiKey: text('api_key'),
  webhookSecret: text('webhook_secret'),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
