import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import {
  eq,
  and,
  or,
  ilike,
  desc,
  sql,
} from "drizzle-orm";
import {
  DisputeRecord,
  EvidenceItem,
  AuditLogRecord,
  NotificationItem,
  IntegrationRecord,
  CustomerProfileData,
  OrderDetailData,
  AIAnalysisReport,
} from "@/lib/types";
import {
  mockDisputes,
  mockIntegrations,
  mockNotifications,
  mockAuditLogs,
  mockCustomers,
  mockOrders,
} from "./seed-data";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __mockDisputesState?: DisputeRecord[];
  __mockIntegrationsState?: IntegrationRecord[];
  __mockNotificationsState?: NotificationItem[];
  __mockAuditLogsState?: AuditLogRecord[];
  __dbAvailable?: boolean | null;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({ connectionString: databaseUrl });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool, { schema });

// Demo auth org id maps to seed-data org-1
export const DEMO_ORG_ID = "mock-org-456";
const SEED_ORG_ID = "org-1";

function normalizeOrgId(orgId: string): string {
  return orgId === DEMO_ORG_ID ? SEED_ORG_ID : orgId;
}

function orgMatches(recordOrgId: string, requestedOrgId: string): boolean {
  return (
    recordOrgId === requestedOrgId ||
    (requestedOrgId === DEMO_ORG_ID && recordOrgId === SEED_ORG_ID) ||
    (requestedOrgId === SEED_ORG_ID && recordOrgId === DEMO_ORG_ID)
  );
}

export async function resolveOrganizationId(orgId: string): Promise<string> {
  if (orgId !== DEMO_ORG_ID) return orgId;
  const dbOk = await isDbAvailable();
  if (!dbOk) return SEED_ORG_ID;
  const [org] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.slug, "acme-saas"))
    .limit(1);
  return org?.id ?? orgId;
}

export async function isDbAvailable(): Promise<boolean> {
  if (globalForDb.__dbAvailable !== undefined && globalForDb.__dbAvailable !== null) {
    return globalForDb.__dbAvailable;
  }
  if (!databaseUrl) {
    globalForDb.__dbAvailable = false;
    return false;
  }
  try {
    await pool.query("SELECT 1");
    globalForDb.__dbAvailable = true;
    return true;
  } catch {
    globalForDb.__dbAvailable = false;
    return false;
  }
}

// --- Mock state (rich seed data when PostgreSQL unavailable) ---

function cloneMockDisputes(): DisputeRecord[] {
  return JSON.parse(JSON.stringify(mockDisputes));
}

if (!globalForDb.__mockDisputesState) {
  globalForDb.__mockDisputesState = cloneMockDisputes();
}
if (!globalForDb.__mockIntegrationsState) {
  globalForDb.__mockIntegrationsState = JSON.parse(JSON.stringify(mockIntegrations));
}
if (!globalForDb.__mockNotificationsState) {
  globalForDb.__mockNotificationsState = JSON.parse(JSON.stringify(mockNotifications));
}
if (!globalForDb.__mockAuditLogsState) {
  globalForDb.__mockAuditLogsState = JSON.parse(JSON.stringify(mockAuditLogs));
}

const mockDisputesState = () => globalForDb.__mockDisputesState!;
const mockIntegrationsState = () => globalForDb.__mockIntegrationsState!;
const mockNotificationsState = () => globalForDb.__mockNotificationsState!;
const mockAuditLogsState = () => globalForDb.__mockAuditLogsState!;

// --- Mappers ---

function mapEvidenceRow(row: typeof schema.evidence.$inferSelect): EvidenceItem {
  return {
    id: row.id,
    disputeId: row.disputeId,
    type: row.type as EvidenceItem["type"],
    title: row.title,
    content: row.content,
    fileUrl: row.fileUrl ?? undefined,
    fileSize: row.fileSize ?? undefined,
    fileType: row.fileType ?? undefined,
    sourceIntegration: row.sourceIntegration ?? "Manual Upload",
    isAutoCollected: row.isAutoCollected,
    confidenceScore: row.confidenceScore ?? 85,
    isIncludedInSubmission: row.isIncludedInSubmission,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

function mapCustomerRow(
  row: typeof schema.customers.$inferSelect,
  profileOverride?: CustomerProfileData
): CustomerProfileData {
  const profile = (row.profileData as Partial<CustomerProfileData>) ?? {};
  return {
    id: row.id,
    organizationId: row.organizationId,
    email: row.email,
    name: row.name ?? profileOverride?.name ?? row.email.split("@")[0],
    phoneNumber: row.phoneNumber ?? undefined,
    address: row.address ?? undefined,
    totalOrdersCount: profile.totalOrdersCount ?? profileOverride?.totalOrdersCount ?? 1,
    lifetimeValue: profile.lifetimeValue ?? profileOverride?.lifetimeValue ?? 0,
    previousDisputesCount: profile.previousDisputesCount ?? 0,
    previousDisputesWon: profile.previousDisputesWon ?? 0,
    fraudRiskScore: profile.fraudRiskScore ?? 20,
    accountCreatedAt: profile.accountCreatedAt ?? row.createdAt?.toISOString() ?? new Date().toISOString(),
    lastLoginAt: profile.lastLoginAt ?? new Date().toISOString(),
    sessionLogs: (profile.sessionLogs as CustomerProfileData["sessionLogs"]) ?? [],
    hasAcceptedTos: profile.hasAcceptedTos ?? true,
    tosAcceptedAt: profile.tosAcceptedAt,
    tosVersion: profile.tosVersion,
  };
}

function mapOrderRow(
  row: typeof schema.orders.$inferSelect,
  orderData?: Partial<OrderDetailData>
): OrderDetailData {
  const extra = (row.orderData as Partial<OrderDetailData>) ?? {};
  return {
    id: row.id,
    organizationId: row.organizationId,
    customerId: row.customerId,
    externalOrderId: row.externalOrderId,
    amount: parseFloat(row.amount),
    currency: row.currency,
    status: row.status,
    items: extra.items ?? orderData?.items ?? [],
    billingAddress: extra.billingAddress ?? orderData?.billingAddress ?? "",
    shippingAddress: extra.shippingAddress ?? orderData?.shippingAddress,
    avsResult: extra.avsResult ?? orderData?.avsResult ?? "MATCH",
    cvcResult: extra.cvcResult ?? orderData?.cvcResult ?? "MATCH",
    threeDSecure: extra.threeDSecure ?? orderData?.threeDSecure ?? "AUTHENTICATED",
    trackingNumber: extra.trackingNumber ?? orderData?.trackingNumber,
    carrier: extra.carrier ?? orderData?.carrier,
    carrierStatus: extra.carrierStatus ?? orderData?.carrierStatus,
    deliverySignature: extra.deliverySignature ?? orderData?.deliverySignature,
    shippedAt: row.shippedAt?.toISOString() ?? extra.shippedAt,
    deliveredAt: row.deliveredAt?.toISOString() ?? extra.deliveredAt,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

function mapDisputeRow(
  row: typeof schema.disputes.$inferSelect,
  customer?: CustomerProfileData,
  order?: OrderDetailData,
  evidenceList?: EvidenceItem[]
): DisputeRecord {
  return {
    id: row.id,
    organizationId: row.organizationId,
    orderId: row.orderId,
    customerId: row.customerId ?? order?.customerId ?? "",
    externalDisputeId: row.externalDisputeId,
    processor: row.processor as DisputeRecord["processor"],
    processorDisputeId: row.processorDisputeId ?? row.externalDisputeId,
    reason: row.reason,
    reasonCode: row.reasonCode ?? "10.4",
    amount: parseFloat(row.amount),
    feeAmount: row.feeAmount ? parseFloat(row.feeAmount) : 15,
    currency: row.currency,
    status: row.status as DisputeRecord["status"],
    deadline: row.deadline?.toISOString() ?? new Date().toISOString(),
    riskLevel: (row.riskLevel as DisputeRecord["riskLevel"]) ?? "MEDIUM",
    cardBrand: (row.cardBrand as DisputeRecord["cardBrand"]) ?? "visa",
    cardLast4: row.cardLast4 ?? "0000",
    cardholderName: row.cardholderName ?? customer?.name ?? "Unknown",
    evidenceStrengthScore: row.evidenceStrengthScore ?? 0,
    winProbability: row.winProbability ?? 0,
    rebuttalLetter: row.rebuttalLetter ?? "",
    rebuttalTone: (row.rebuttalTone as DisputeRecord["rebuttalTone"]) ?? "firm",
    approvedByUserId: row.approvedByUserId ?? undefined,
    approvedByUserName: row.approvedByUserName ?? undefined,
    approvalNotes: row.approvalNotes ?? undefined,
    approvedAt: row.approvedAt?.toISOString(),
    submittedAt: row.submittedAt?.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString(),
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
    customer,
    order,
    evidenceList: evidenceList ?? [],
    aiAnalysis: row.aiAnalysis as unknown as AIAnalysisReport | undefined,
  };
}

export interface DisputeFilters {
  organizationId: string;
  status?: string;
  processor?: string;
  search?: string;
  riskLevel?: string;
}

export interface AuditContext {
  userId?: string;
  actorName?: string;
  actorRole?: string;
  action?: string;
  details?: string;
  organizationId?: string;
  ipAddress?: string;
}

async function loadDisputeRelations(
  disputeRow: typeof schema.disputes.$inferSelect
): Promise<DisputeRecord> {
  const [customerRows, orderRows, evidenceRows] = await Promise.all([
    disputeRow.customerId
      ? db.select().from(schema.customers).where(eq(schema.customers.id, disputeRow.customerId)).limit(1)
      : db.select().from(schema.customers)
          .innerJoin(schema.orders, eq(schema.orders.customerId, schema.customers.id))
          .where(eq(schema.orders.id, disputeRow.orderId))
          .limit(1)
          .then((rows) => rows.map((r) => r.customers)),
    db.select().from(schema.orders).where(eq(schema.orders.id, disputeRow.orderId)).limit(1),
    db.select().from(schema.evidence).where(eq(schema.evidence.disputeId, disputeRow.id)),
  ]);

  const customer = customerRows[0] ? mapCustomerRow(customerRows[0]) : undefined;
  const order = orderRows[0] ? mapOrderRow(orderRows[0]) : undefined;
  const evidenceList = evidenceRows.map(mapEvidenceRow);

  return mapDisputeRow(disputeRow, customer, order, evidenceList);
}

// --- Disputes ---

export async function getDisputes(filters: Partial<DisputeFilters> = {}): Promise<DisputeRecord[]> {
  const safeFilters = { organizationId: DEMO_ORG_ID, ...filters };
  const dbOk = await isDbAvailable();
  const resolvedOrgId = dbOk ? await resolveOrganizationId(safeFilters.organizationId) : safeFilters.organizationId;
  if (!dbOk) {
    let list = mockDisputesState().filter((d) => orgMatches(d.organizationId, safeFilters.organizationId));
    if (safeFilters.status && safeFilters.status !== "ALL") {
      list = list.filter((d) => d.status === safeFilters.status);
    }
    if (safeFilters.processor && safeFilters.processor !== "ALL") {
      list = list.filter((d) => d.processor === safeFilters.processor);
    }
    if (safeFilters.riskLevel && safeFilters.riskLevel !== "ALL") {
      list = list.filter((d) => d.riskLevel === safeFilters.riskLevel);
    }
    if (safeFilters.search) {
      const q = safeFilters.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.externalDisputeId.toLowerCase().includes(q) ||
          d.reason.toLowerCase().includes(q) ||
          d.customer?.name?.toLowerCase().includes(q) ||
          d.customer?.email?.toLowerCase().includes(q) ||
          d.cardLast4.includes(q)
      );
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const conditions = [eq(schema.disputes.organizationId, resolvedOrgId)];

  if (safeFilters.status && safeFilters.status !== "ALL") {
    conditions.push(eq(schema.disputes.status, safeFilters.status as typeof schema.disputes.status.enumValues[number]));
  }
  if (safeFilters.processor && safeFilters.processor !== "ALL") {
    conditions.push(eq(schema.disputes.processor, safeFilters.processor));
  }
  if (safeFilters.riskLevel && safeFilters.riskLevel !== "ALL") {
    conditions.push(eq(schema.disputes.riskLevel, safeFilters.riskLevel));
  }
  if (safeFilters.search) {
    const q = `%${safeFilters.search}%`;
    conditions.push(
      or(
        ilike(schema.disputes.externalDisputeId, q),
        ilike(schema.disputes.reason, q),
        ilike(schema.disputes.cardLast4, q),
        ilike(schema.disputes.cardholderName, q)
      )!
    );
  }

  const rows = await db
    .select()
    .from(schema.disputes)
    .where(and(...conditions))
    .orderBy(desc(schema.disputes.createdAt));

  return Promise.all(rows.map(loadDisputeRelations));
}

export async function getDisputeById(
  id: string,
  organizationId: string
): Promise<DisputeRecord | null> {
  const dbOk = await isDbAvailable();
  const resolvedOrgId = dbOk ? await resolveOrganizationId(organizationId) : organizationId;
  if (!dbOk) {
    const dispute =
      mockDisputesState().find(
        (d) =>
          orgMatches(d.organizationId, organizationId) &&
          (d.id === id || d.externalDisputeId === id)
      ) ?? null;
    return dispute ? JSON.parse(JSON.stringify(dispute)) : null;
  }

  const rows = await db
    .select()
    .from(schema.disputes)
    .where(
      and(
        eq(schema.disputes.organizationId, resolvedOrgId),
        or(eq(schema.disputes.id, id), eq(schema.disputes.externalDisputeId, id))
      )
    )
    .limit(1);

  if (rows.length === 0) return null;
  return loadDisputeRelations(rows[0]);
}

export async function updateDispute(
  id: string,
  orgId: string,
  updates: Record<string, unknown>,
  audit?: AuditContext
): Promise<DisputeRecord | null> {
  const dbOk = await isDbAvailable();
  const resolvedOrgId = dbOk ? await resolveOrganizationId(orgId) : orgId;

  const dbUpdates: Record<string, unknown> = { ...updates, updatedAt: new Date() };
  if (typeof updates.resolvedAt === "string") {
    dbUpdates.resolvedAt = new Date(updates.resolvedAt);
  }
  if (typeof updates.approvedAt === "string") {
    dbUpdates.approvedAt = new Date(updates.approvedAt);
  }
  if (typeof updates.submittedAt === "string") {
    dbUpdates.submittedAt = new Date(updates.submittedAt);
  }

  if (!dbOk) {
    const idx = mockDisputesState().findIndex(
      (d) => orgMatches(d.organizationId, orgId) && d.id === id
    );
    if (idx === -1) return null;
    mockDisputesState()[idx] = {
      ...mockDisputesState()[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    } as DisputeRecord;
    if (audit) {
      await addAuditLog({
        organizationId: orgId,
        userId: audit.userId,
        userName: audit.actorName ?? "System",
        userRole: audit.actorRole ?? "SYSTEM",
        action: audit.action ?? "DISPUTE_UPDATED",
        entityType: "DISPUTE",
        entityId: id,
        details: audit.details ?? "Dispute updated",
        ipAddress: audit.ipAddress ?? "127.0.0.1",
      });
    }
    return JSON.parse(JSON.stringify(mockDisputesState()[idx]));
  }

  const [updated] = await db
    .update(schema.disputes)
    .set(dbUpdates as Partial<typeof schema.disputes.$inferInsert>)
    .where(and(eq(schema.disputes.id, id), eq(schema.disputes.organizationId, resolvedOrgId)))
    .returning();

  if (!updated) return null;

  if (audit) {
    await addAuditLog({
      organizationId: resolvedOrgId,
      userId: audit.userId,
      userName: audit.actorName ?? "System",
      userRole: audit.actorRole ?? "SYSTEM",
      action: audit.action ?? "DISPUTE_UPDATED",
      entityType: "DISPUTE",
      entityId: id,
      details: audit.details ?? "Dispute updated",
      ipAddress: audit.ipAddress ?? "127.0.0.1",
    });
  }

  return loadDisputeRelations(updated);
}

export interface CreateDisputeInput {
  organizationId: string;
  userId?: string;
  customerEmail: string;
  customerName?: string;
  amount: number;
  reason: string;
  processor?: string;
  cardBrand?: string;
  cardLast4?: string;
  reasonCode?: string;
}

export async function createDispute(data: CreateDisputeInput): Promise<DisputeRecord> {
  const dbOk = await isDbAvailable();
  const resolvedOrgId = dbOk
    ? await resolveOrganizationId(data.organizationId)
    : normalizeOrgId(data.organizationId);
  const effectiveOrgId = dbOk ? resolvedOrgId : normalizeOrgId(data.organizationId);

  if (!dbOk) {
    const mockCustomer = mockCustomers.find((c) => c.email === data.customerEmail) ?? {
      id: `cust-${Date.now()}`,
      organizationId: SEED_ORG_ID,
      email: data.customerEmail,
      name: data.customerName ?? "New Customer",
      phoneNumber: "+15550000000",
      address: "Unknown",
      totalOrdersCount: 1,
      lifetimeValue: data.amount,
      previousDisputesCount: 0,
      previousDisputesWon: 0,
      fraudRiskScore: 25,
      accountCreatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      sessionLogs: [],
      hasAcceptedTos: true,
    };

    const mockOrder: OrderDetailData = {
      id: `ord-${Date.now()}`,
      organizationId: SEED_ORG_ID,
      customerId: mockCustomer.id,
      externalOrderId: `ORD-${Math.floor(Math.random() * 9000) + 1000}`,
      amount: data.amount,
      currency: "USD",
      status: "completed",
      items: [{ name: "Subscription", sku: "SUB-001", quantity: 1, price: data.amount, type: "digital" }],
      billingAddress: mockCustomer.address ?? "",
      avsResult: "MATCH",
      cvcResult: "MATCH",
      threeDSecure: "AUTHENTICATED",
      createdAt: new Date().toISOString(),
    };

    const extId = `dp_${data.processor ?? "stripe"}_${Math.random().toString(36).substring(2, 10)}`;
    const newDispute: DisputeRecord = {
      id: `dsp-${Date.now()}`,
      organizationId: SEED_ORG_ID,
      orderId: mockOrder.id,
      customerId: mockCustomer.id,
      externalDisputeId: extId,
      processor: (data.processor ?? "stripe") as DisputeRecord["processor"],
      processorDisputeId: extId,
      reason: data.reason,
      reasonCode: data.reasonCode ?? "10.4",
      amount: data.amount,
      feeAmount: 15,
      currency: "USD",
      status: "OPEN",
      deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      riskLevel: data.amount > 500 ? "HIGH" : "MEDIUM",
      cardBrand: (data.cardBrand ?? "visa") as DisputeRecord["cardBrand"],
      cardLast4: data.cardLast4 ?? "4242",
      cardholderName: data.customerName ?? mockCustomer.name,
      evidenceStrengthScore: 0,
      winProbability: 0,
      rebuttalLetter: "",
      rebuttalTone: "firm",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer: mockCustomer,
      order: mockOrder,
      evidenceList: [],
    };

    mockDisputesState().unshift(newDispute);

    await addAuditLog({
      organizationId: effectiveOrgId,
      userId: data.userId,
      userName: "Webhook Ingest Worker",
      userRole: "INTEGRATION_BOT",
      action: "DISPUTE_CREATED",
      entityType: "DISPUTE",
      entityId: newDispute.id,
      details: `New ${newDispute.processor} chargeback ingested for $${data.amount.toFixed(2)} — ${data.reason}`,
    });

    await addNotification({
      organizationId: effectiveOrgId,
      title: `New Dispute: ${extId}`,
      message: `$${data.amount.toFixed(2)} chargeback from ${data.customerName ?? data.customerEmail} requires evidence collection.`,
      type: "DISPUTE_NEW",
      severity: "warning",
      read: false,
      linkUrl: `/disputes/${newDispute.id}`,
    });

    return JSON.parse(JSON.stringify(newDispute));
  }

  // Find or create customer
  let customerRow = (
    await db
      .select()
      .from(schema.customers)
      .where(
        and(
          eq(schema.customers.organizationId, resolvedOrgId),
          eq(schema.customers.email, data.customerEmail)
        )
      )
      .limit(1)
  )[0];

  if (!customerRow) {
    const seedCustomer = mockCustomers.find((c) => c.email === data.customerEmail);
    [customerRow] = await db
      .insert(schema.customers)
      .values({
        organizationId: resolvedOrgId,
        email: data.customerEmail,
        name: data.customerName ?? seedCustomer?.name ?? data.customerEmail.split("@")[0],
        phoneNumber: seedCustomer?.phoneNumber,
        address: seedCustomer?.address,
        profileData: seedCustomer ? { ...seedCustomer, sessionLogs: seedCustomer.sessionLogs } : {},
      })
      .returning();
  }

  const seedOrder = mockOrders.find((o) => o.customerId === customerRow.id);
  const [orderRow] = await db
    .insert(schema.orders)
    .values({
      organizationId: resolvedOrgId,
      customerId: customerRow.id,
      externalOrderId: seedOrder?.externalOrderId ?? `ORD-${Date.now()}`,
      amount: String(data.amount),
      currency: "USD",
      status: "completed",
      shippedAt: seedOrder?.shippedAt ? new Date(seedOrder.shippedAt) : new Date(Date.now() - 5 * 86400000),
      deliveredAt: seedOrder?.deliveredAt ? new Date(seedOrder.deliveredAt) : new Date(Date.now() - 3 * 86400000),
      orderData: (seedOrder ?? {}) as Record<string, unknown>,
    })
    .returning();

  const extId = `dp_${data.processor ?? "stripe"}_${Math.random().toString(36).substring(2, 10)}`;
  const [disputeRow] = await db
    .insert(schema.disputes)
    .values({
      organizationId: resolvedOrgId,
      orderId: orderRow.id,
      customerId: customerRow.id,
      externalDisputeId: extId,
      processorDisputeId: extId,
      processor: data.processor ?? "stripe",
      reason: data.reason,
      reasonCode: data.reasonCode ?? "10.4",
      amount: String(data.amount),
      feeAmount: "15.00",
      currency: "USD",
      status: "OPEN",
      deadline: new Date(Date.now() + 7 * 86400000),
      riskLevel: data.amount > 500 ? "HIGH" : "MEDIUM",
      cardBrand: data.cardBrand ?? "visa",
      cardLast4: data.cardLast4 ?? "4242",
      cardholderName: data.customerName ?? customerRow.name ?? "Unknown",
    })
    .returning();

  await addAuditLog({
    organizationId: resolvedOrgId,
    userId: data.userId,
    userName: "Webhook Ingest Worker",
    userRole: "INTEGRATION_BOT",
    action: "DISPUTE_CREATED",
    entityType: "DISPUTE",
    entityId: disputeRow.id,
    details: `New chargeback ingested: ${extId} for $${data.amount.toFixed(2)}`,
  });

  await addNotification({
    organizationId: resolvedOrgId,
    title: `New Dispute: ${extId}`,
    message: `$${data.amount.toFixed(2)} chargeback requires evidence collection.`,
    type: "DISPUTE_NEW",
    severity: "warning",
    read: false,
    linkUrl: `/disputes/${disputeRow.id}`,
  });

  return loadDisputeRelations(disputeRow);
}

// --- Evidence ---

export async function addEvidence(
  evidenceData: {
    disputeId: string;
    type?: string;
    title: string;
    content: string;
    sourceIntegration?: string;
    isAutoCollected?: boolean;
    confidenceScore?: number;
    isIncludedInSubmission?: boolean;
  },
  audit?: AuditContext
): Promise<EvidenceItem> {
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    const newEv: EvidenceItem = {
      id: `ev-${Date.now()}`,
      disputeId: evidenceData.disputeId,
      type: (evidenceData.type ?? "OTHER") as EvidenceItem["type"],
      title: evidenceData.title,
      content: evidenceData.content,
      sourceIntegration: evidenceData.sourceIntegration ?? "Manual Upload",
      isAutoCollected: evidenceData.isAutoCollected ?? false,
      confidenceScore: evidenceData.confidenceScore ?? 85,
      isIncludedInSubmission: evidenceData.isIncludedInSubmission ?? true,
      createdAt: new Date().toISOString(),
    };

    const dispute = mockDisputesState().find((d) => d.id === evidenceData.disputeId);
    if (dispute) {
      dispute.evidenceList = [...(dispute.evidenceList ?? []), newEv];
      if (dispute.status === "OPEN") dispute.status = "EVIDENCE_COLLECTING";
    }

    if (audit) {
      await addAuditLog({
        organizationId: audit.organizationId ?? SEED_ORG_ID,
        userId: audit.userId,
        userName: audit.actorName ?? "System",
        userRole: audit.actorRole ?? "SYSTEM",
        action: "EVIDENCE_ADDED",
        entityType: "EVIDENCE",
        entityId: newEv.id,
        details: `Evidence added: ${evidenceData.title}`,
      });
    }

    return newEv;
  }

  const [newEvidence] = await db
    .insert(schema.evidence)
    .values({
      disputeId: evidenceData.disputeId,
      type: (evidenceData.type ?? "OTHER") as typeof schema.evidence.type.enumValues[number],
      title: evidenceData.title,
      content: evidenceData.content,
      sourceIntegration: evidenceData.sourceIntegration ?? "Manual Upload",
      isAutoCollected: evidenceData.isAutoCollected ?? false,
      confidenceScore: evidenceData.confidenceScore ?? 85,
      isIncludedInSubmission: evidenceData.isIncludedInSubmission ?? true,
    })
    .returning();

  // Move dispute to evidence collecting if still open
  await db
    .update(schema.disputes)
    .set({ status: "EVIDENCE_COLLECTING", updatedAt: new Date() })
    .where(
      and(
        eq(schema.disputes.id, evidenceData.disputeId),
        eq(schema.disputes.status, "OPEN")
      )
    );

  if (audit) {
    await addAuditLog({
      organizationId: audit.organizationId!,
      userId: audit.userId,
      userName: audit.actorName ?? "System",
      userRole: audit.actorRole ?? "SYSTEM",
      action: "EVIDENCE_ADDED",
      entityType: "EVIDENCE",
      entityId: newEvidence.id,
      details: `Evidence added: ${evidenceData.title}`,
    });
  }

  return mapEvidenceRow(newEvidence);
}

export async function updateEvidenceInclusion(
  evidenceId: string,
  disputeId: string,
  orgId: string,
  isIncludedInSubmission: boolean
): Promise<DisputeRecord | null> {
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    const dispute = mockDisputesState().find(
      (d) => orgMatches(d.organizationId, orgId) && d.id === disputeId
    );
    if (dispute?.evidenceList) {
      const ev = dispute.evidenceList.find((e) => e.id === evidenceId);
      if (ev) ev.isIncludedInSubmission = isIncludedInSubmission;
    }
    return getDisputeById(disputeId, orgId);
  }

  await db
    .update(schema.evidence)
    .set({ isIncludedInSubmission })
    .where(eq(schema.evidence.id, evidenceId));

  return getDisputeById(disputeId, orgId);
}

// --- Audit logs ---

export async function addAuditLog(
  log: Omit<AuditLogRecord, "id" | "createdAt" | "ipAddress"> & { entityId: string; ipAddress?: string }
): Promise<AuditLogRecord> {
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    const entry: AuditLogRecord = {
      id: `aud-${Date.now()}`,
      ...log,
      userName: log.userName ?? "System",
      userRole: log.userRole ?? "SYSTEM",
      ipAddress: log.ipAddress ?? "127.0.0.1",
      createdAt: new Date().toISOString(),
    };
    mockAuditLogsState().unshift(entry);
    return entry;
  }

  const [row] = await db
    .insert(schema.auditLogs)
    .values({
      organizationId: log.organizationId,
      userId: log.userId ?? null,
      userName: log.userName,
      userRole: log.userRole,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      ipAddress: log.ipAddress ?? "127.0.0.1",
    })
    .returning();

  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId ?? undefined,
    userName: row.userName ?? "System",
    userRole: row.userRole ?? "SYSTEM",
    action: row.action,
    entityType: row.entityType as AuditLogRecord["entityType"],
    entityId: row.entityId,
    details: row.details ?? "",
    ipAddress: row.ipAddress ?? "127.0.0.1",
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getAuditLogs(filters: {
  organizationId: string;
  entityType?: string;
  entityId?: string;
  search?: string;
}): Promise<AuditLogRecord[]> {
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    let list = mockAuditLogsState().filter((l) => orgMatches(l.organizationId, filters.organizationId));
    if (filters.entityType && filters.entityType !== "ALL") {
      list = list.filter((l) => l.entityType === filters.entityType);
    }
    if (filters.entityId) {
      list = list.filter((l) => l.entityId === filters.entityId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q)
      );
    }
    return list;
  }

  const conditions = [eq(schema.auditLogs.organizationId, filters.organizationId)];

  if (filters.entityType && filters.entityType !== "ALL") {
    conditions.push(eq(schema.auditLogs.entityType, filters.entityType));
  }
  if (filters.entityId) {
    conditions.push(eq(schema.auditLogs.entityId, filters.entityId));
  }
  if (filters.search) {
    const q = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(schema.auditLogs.action, q),
        ilike(schema.auditLogs.details, q),
        ilike(schema.auditLogs.userName, q)
      )!
    );
  }

  const rows = await db
    .select()
    .from(schema.auditLogs)
    .where(and(...conditions))
    .orderBy(desc(schema.auditLogs.createdAt));

  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId ?? undefined,
    userName: row.userName ?? "System",
    userRole: row.userRole ?? "SYSTEM",
    action: row.action,
    entityType: row.entityType as AuditLogRecord["entityType"],
    entityId: row.entityId,
    details: row.details ?? "",
    ipAddress: row.ipAddress ?? "127.0.0.1",
    createdAt: row.createdAt.toISOString(),
  }));
}

// --- Notifications ---

export async function getNotifications(orgId: string): Promise<NotificationItem[]> {
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    return mockNotificationsState()
      .filter((n) => orgMatches(n.organizationId, orgId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const rows = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.organizationId, orgId))
    .orderBy(desc(schema.notifications.createdAt));

  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    message: row.message,
    type: row.type as NotificationItem["type"],
    severity: row.severity as NotificationItem["severity"],
    read: row.read,
    linkUrl: row.linkUrl ?? "",
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function addNotification(
  notif: Omit<NotificationItem, "id" | "createdAt">
): Promise<NotificationItem> {
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    const item: NotificationItem = {
      id: `notif-${Date.now()}`,
      ...notif,
      createdAt: new Date().toISOString(),
    };
    mockNotificationsState().unshift(item);
    return item;
  }

  const [row] = await db
    .insert(schema.notifications)
    .values({
      organizationId: notif.organizationId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      severity: notif.severity,
      read: notif.read,
      linkUrl: notif.linkUrl,
    })
    .returning();

  return {
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    message: row.message,
    type: row.type as NotificationItem["type"],
    severity: row.severity as NotificationItem["severity"],
    read: row.read,
    linkUrl: row.linkUrl ?? "",
    createdAt: row.createdAt.toISOString(),
  };
}

export async function markNotificationAsRead(id: string, orgId: string): Promise<boolean> {
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    const notif = mockNotificationsState().find((n) => n.id === id && orgMatches(n.organizationId, orgId));
    if (notif) notif.read = true;
    return !!notif;
  }

  const result = await db
    .update(schema.notifications)
    .set({ read: true })
    .where(
      and(eq(schema.notifications.id, id), eq(schema.notifications.organizationId, orgId))
    );

  return (result.rowCount ?? 0) > 0;
}

export async function markAllNotificationsRead(orgId: string): Promise<void> {
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    mockNotificationsState().forEach((n) => {
      if (orgMatches(n.organizationId, orgId)) n.read = true;
    });
    return;
  }

  await db
    .update(schema.notifications)
    .set({ read: true })
    .where(eq(schema.notifications.organizationId, orgId));
}

// --- Integrations ---

function mapIntegrationRow(row: typeof schema.integrations.$inferSelect): IntegrationRecord {
  const config = (row.config as Record<string, unknown>) ?? {};
  return {
    id: row.id,
    organizationId: row.organizationId,
    processor: row.processor,
    displayName: row.displayName ?? row.processor,
    category: (row.category as IntegrationRecord["category"]) ?? "PAYMENT_PROCESSOR",
    status: row.status as IntegrationRecord["status"],
    lastSyncAt: row.lastSyncAt
      ? formatRelativeTime(row.lastSyncAt)
      : "Never",
    syncedDisputesCount: row.syncedDisputesCount ?? 0,
    webhookUrl: row.webhookUrl ?? "",
    apiKeyMasked: row.apiKey ? maskApiKey(row.apiKey) : undefined,
    config,
  };
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 8)}••••••••${key.slice(-4)}`;
}

function formatRelativeTime(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

export async function getIntegrations(orgId: string): Promise<IntegrationRecord[]> {
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    return mockIntegrationsState().filter((i) => orgMatches(i.organizationId, orgId));
  }

  const rows = await db
    .select()
    .from(schema.integrations)
    .where(eq(schema.integrations.organizationId, orgId));

  if (rows.length === 0) {
    return mockIntegrations.filter((i) => orgMatches(i.organizationId, orgId));
  }

  return rows.map(mapIntegrationRow);
}

export async function updateIntegration(
  integrationId: string,
  orgId: string,
  action: "TOGGLE_STATUS" | "SYNC_NOW"
): Promise<IntegrationRecord | null> {
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    const idx = mockIntegrationsState().findIndex(
      (i) => i.id === integrationId && orgMatches(i.organizationId, orgId)
    );
    if (idx === -1) return null;

    const updated = { ...mockIntegrationsState()[idx] };
    if (action === "TOGGLE_STATUS") {
      updated.status = updated.status === "connected" ? "disconnected" : "connected";
    } else if (action === "SYNC_NOW") {
      updated.lastSyncAt = "Just now";
      updated.syncedDisputesCount += Math.floor(Math.random() * 5) + 1;
    }
    mockIntegrationsState()[idx] = updated;
    return updated;
  }

  const existing = (
    await db
      .select()
      .from(schema.integrations)
      .where(
        and(
          eq(schema.integrations.id, integrationId),
          eq(schema.integrations.organizationId, orgId)
        )
      )
      .limit(1)
  )[0];

  if (!existing) return null;

  const updates: Partial<typeof schema.integrations.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (action === "TOGGLE_STATUS") {
    updates.status = existing.status === "connected" ? "disconnected" : "connected";
  } else if (action === "SYNC_NOW") {
    updates.lastSyncAt = new Date();
    updates.syncedDisputesCount = (existing.syncedDisputesCount ?? 0) + Math.floor(Math.random() * 5) + 1;
  }

  const [updated] = await db
    .update(schema.integrations)
    .set(updates)
    .where(eq(schema.integrations.id, integrationId))
    .returning();

  return updated ? mapIntegrationRow(updated) : null;
}

// --- Analytics ---

export async function getAnalyticsSummary(orgId: string) {
  const disputes = await getDisputes({ organizationId: orgId });

  const open = disputes.filter((d) => !["WON", "LOST", "EXPIRED"].includes(d.status));
  const won = disputes.filter((d) => d.status === "WON");
  const lost = disputes.filter((d) => d.status === "LOST");
  const resolved = won.length + lost.length;

  const totalAtRisk = open.reduce((sum, d) => sum + d.amount, 0);
  const totalRecovered = won.reduce((sum, d) => sum + d.amount, 0);
  const winRate = resolved > 0 ? Math.round((won.length / resolved) * 100) : 0;

  const byProcessor: Record<string, { count: number; won: number; lost: number; amount: number }> = {};
  for (const d of disputes) {
    if (!byProcessor[d.processor]) {
      byProcessor[d.processor] = { count: 0, won: 0, lost: 0, amount: 0 };
    }
    byProcessor[d.processor].count++;
    byProcessor[d.processor].amount += d.amount;
    if (d.status === "WON") byProcessor[d.processor].won++;
    if (d.status === "LOST") byProcessor[d.processor].lost++;
  }

  return {
    totalDisputes: disputes.length,
    openDisputes: open.length,
    wonDisputes: won.length,
    lostDisputes: lost.length,
    winRate,
    totalAtRisk,
    totalRecovered,
    avgEvidenceScore:
      disputes.length > 0
        ? Math.round(
            disputes.reduce((s, d) => s + (d.evidenceStrengthScore ?? 0), 0) / disputes.length
          )
        : 0,
    byProcessor,
  };
}

// --- Processor submission ---

export async function submitDisputeToProcessor(
  disputeId: string,
  orgId: string,
  audit?: AuditContext
): Promise<DisputeRecord | null> {
  const dispute = await getDisputeById(disputeId, orgId);
  if (!dispute) return null;

  const includedEvidence = (dispute.evidenceList ?? []).filter((e) => e.isIncludedInSubmission);

  const updated = await updateDispute(
    disputeId,
    orgId,
    {
      status: "SUBMITTED",
      submittedAt: new Date().toISOString(),
    },
    {
      ...audit,
      action: "DISPUTE_SUBMITTED_TO_PROCESSOR",
      details: `Transmitted ${includedEvidence.length} evidence items to ${dispute.processor.toUpperCase()} for dispute ${dispute.externalDisputeId}.`,
    });
  return updated;
}

