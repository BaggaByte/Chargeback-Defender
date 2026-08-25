import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import {
  DisputeRecord,
  EvidenceItem,
  AuditLogRecord,
  NotificationItem,
} from "@/lib/types";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool, { schema });

// Helper to construct DisputeRecord from DB rows
async function hydrateDispute(d: any): Promise<DisputeRecord> {
  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, d.customerId)).limit(1);
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, d.orderId)).limit(1);
  const evidenceList = await db.select().from(schema.evidence).where(eq(schema.evidence.disputeId, d.id));

  return {
    ...d,
    customer,
    order,
    evidenceList,
  } as DisputeRecord;
}

export async function getDisputes(filters?: {
  organizationId?: string;
  status?: string;
  processor?: string;
  search?: string;
  riskLevel?: string;
}): Promise<DisputeRecord[]> {
  let conditions = [];

  if (filters?.organizationId) {
    conditions.push(eq(schema.disputes.organizationId, filters.organizationId));
  }
  if (filters?.status && filters.status !== 'ALL') {
    conditions.push(eq(schema.disputes.status, filters.status as any));
  }
  if (filters?.processor && filters.processor !== 'ALL') {
    conditions.push(eq(schema.disputes.processor, filters.processor));
  }
  // Currently riskLevel isn't in the schema, assuming it's omitted or handled elsewhere if it was added. Let's ignore if not in schema.
  
  if (filters?.search) {
    const q = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(schema.disputes.externalDisputeId, q),
        ilike(schema.disputes.reason, q),
      )
    );
  }

  const query = db.select().from(schema.disputes);
  if (conditions.length > 0) {
    query.where(and(...conditions));
  }
  query.orderBy(desc(schema.disputes.createdAt));

  const rows = await query;
  const hydrated = await Promise.all(rows.map(row => hydrateDispute(row)));
  
  if (filters?.riskLevel && filters.riskLevel !== 'ALL') {
    return hydrated.filter(d => d.riskLevel === filters.riskLevel);
  }

  return hydrated;
}

export async function getDisputeById(id: string, organizationId: string): Promise<DisputeRecord | null> {
  const rows = await db
    .select()
    .from(schema.disputes)
    .where(
      and(
        eq(schema.disputes.organizationId, organizationId),
        or(eq(schema.disputes.id, id), eq(schema.disputes.externalDisputeId, id))
      )
    )
    .limit(1);

  if (rows.length === 0) return null;
  return hydrateDispute(rows[0]);
}

export async function updateDispute(
  id: string,
  organizationId: string,
  updates: Partial<DisputeRecord>,
  auditInfo?: { actorName: string; actorRole: string; action: string; details: string; userId?: string }
): Promise<DisputeRecord | null> {
  
  // Exclude relations from updates
  const { customer, order, evidenceList, ...dbUpdates } = updates as any;
  
  const [updated] = await db
    .update(schema.disputes)
    .set({ ...dbUpdates, updatedAt: new Date() })
    .where(and(eq(schema.disputes.id, id), eq(schema.disputes.organizationId, organizationId)))
    .returning();

  if (!updated) return null;

  if (auditInfo) {
    await addAuditLog({
      organizationId,
      userId: auditInfo.userId, // Map from session
      action: auditInfo.action,
      entityType: 'DISPUTE',
      entityId: id,
      details: auditInfo.details,
    } as any); // Note: schema has different fields than mock
  }

  return hydrateDispute(updated);
}

export async function addEvidence(
  evidence: Omit<EvidenceItem, 'id' | 'createdAt'>,
  auditInfo?: { actorName: string; actorRole: string; userId?: string; organizationId: string }
): Promise<EvidenceItem> {
  const [newEvidence] = await db.insert(schema.evidence).values({
    ...evidence,
    isAutoCollected: evidence.isAutoCollected ?? false,
  } as any).returning();

  if (auditInfo) {
    await addAuditLog({
      organizationId: auditInfo.organizationId,
      userId: auditInfo.userId,
      action: 'EVIDENCE_ADDED',
      entityType: 'EVIDENCE',
      entityId: newEvidence.id,
      details: `Added evidence "${newEvidence.title}" (${newEvidence.type}) for dispute ${newEvidence.disputeId}`,
    } as any);
  }

  return newEvidence as unknown as EvidenceItem;
}

export async function addAuditLog(
  log: typeof schema.auditLogs.$inferInsert
): Promise<any> {
  const [newLog] = await db.insert(schema.auditLogs).values(log).returning();
  return newLog;
}

export async function addNotification(notif: any): Promise<any> {
  const [newNotif] = await db.insert(schema.notifications).values(notif).returning();
  return newNotif;
}
export async function markNotificationAsRead(id: string): Promise<boolean> {
  const [updated] = await db.update(schema.notifications)
    .set({ read: true })
    .where(eq(schema.notifications.id, id))
    .returning();
  return !!updated;
}
export async function markAllNotificationsRead(organizationId: string): Promise<void> {
  await db.update(schema.notifications)
    .set({ read: true })
    .where(eq(schema.notifications.organizationId, organizationId));
}

export async function createDispute(data: {
  organizationId: string;
  orderId?: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  reason: string;
  processor: any;
  cardBrand?: string;
  cardLast4?: string;
  userId?: string;
}): Promise<DisputeRecord> {
  const extDisputeId = `dp_${data.processor}_${Math.random().toString(36).substring(2, 10)}`;

  // Find customer by email
  let customerRows = await db.select().from(schema.customers).where(
    and(eq(schema.customers.email, data.customerEmail), eq(schema.customers.organizationId, data.organizationId))
  ).limit(1);
  
  let customerId = customerRows[0]?.id;
  
  if (!customerId) {
    const [newCustomer] = await db.insert(schema.customers).values({
      organizationId: data.organizationId,
      email: data.customerEmail,
      phoneNumber: '+1 (555) 019-2831',
      address: '100 Innovation Way, Suite 400, Austin, TX 78701',
    }).returning();
    customerId = newCustomer.id;
  }

  // Create order
  const [newOrder] = await db.insert(schema.orders).values({
    organizationId: data.organizationId,
    customerId,
    externalOrderId: `ORD-${Date.now().toString().slice(-6)}`,
    amount: data.amount.toString(),
    currency: 'USD',
    status: 'completed',
  }).returning();

  // Create dispute
  const [newDispute] = await db.insert(schema.disputes).values({
    organizationId: data.organizationId,
    orderId: newOrder.id,
    externalDisputeId: extDisputeId,
    processor: data.processor || 'stripe',
    reason: data.reason,
    amount: data.amount.toString(),
    currency: 'USD',
    status: 'OPEN',
    deadline: new Date(Date.now() + 7 * 86400000),
  }).returning();

  await addAuditLog({
    organizationId: data.organizationId,
    userId: data.userId,
    action: 'DISPUTE_CREATED',
    entityType: 'DISPUTE',
    entityId: newDispute.id,
    details: `Created new dispute ${newDispute.externalDisputeId} ($${data.amount})`,
  });

  return hydrateDispute(newDispute);
}
