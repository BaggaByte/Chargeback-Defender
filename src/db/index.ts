import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import {
  mockDisputes,
  mockCustomers,
  mockOrders,
  mockEvidenceItems,
  mockAuditLogs,
  mockNotifications,
  mockIntegrations,
  mockOrganizations,
} from "./seed-data";
import {
  DisputeRecord,
  EvidenceItem,
  AuditLogRecord,
  NotificationItem,
  IntegrationRecord,
  CustomerProfileData,
  OrderDetailData,
  OrganizationInfo,
} from "@/lib/types";

// In-memory store holding real-time mutable platform state
interface StoreState {
  organizations: OrganizationInfo[];
  customers: CustomerProfileData[];
  orders: OrderDetailData[];
  disputes: DisputeRecord[];
  evidence: EvidenceItem[];
  auditLogs: AuditLogRecord[];
  notifications: NotificationItem[];
  integrations: IntegrationRecord[];
}

const globalForStore = globalThis as typeof globalThis & {
  __chargebackDefenderStore?: StoreState;
};

if (!globalForStore.__chargebackDefenderStore) {
  globalForStore.__chargebackDefenderStore = {
    organizations: JSON.parse(JSON.stringify(mockOrganizations)),
    customers: JSON.parse(JSON.stringify(mockCustomers)),
    orders: JSON.parse(JSON.stringify(mockOrders)),
    disputes: JSON.parse(JSON.stringify(mockDisputes)),
    evidence: JSON.parse(JSON.stringify(mockEvidenceItems)),
    auditLogs: JSON.parse(JSON.stringify(mockAuditLogs)),
    notifications: JSON.parse(JSON.stringify(mockNotifications)),
    integrations: JSON.parse(JSON.stringify(mockIntegrations)),
  };
}

export const store = globalForStore.__chargebackDefenderStore!;

// Data Access Layer with Relational Hydration

export async function getDisputes(filters?: {
  organizationId?: string;
  status?: string;
  processor?: string;
  search?: string;
  riskLevel?: string;
}): Promise<DisputeRecord[]> {
  let list = [...store.disputes];

  if (filters?.organizationId) {
    list = list.filter((d) => d.organizationId === filters.organizationId);
  }
  if (filters?.status && filters.status !== 'ALL') {
    list = list.filter((d) => d.status === filters.status);
  }
  if (filters?.processor && filters.processor !== 'ALL') {
    list = list.filter((d) => d.processor === filters.processor);
  }
  if (filters?.riskLevel && filters.riskLevel !== 'ALL') {
    list = list.filter((d) => d.riskLevel === filters.riskLevel);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (d) =>
        d.externalDisputeId.toLowerCase().includes(q) ||
        d.cardholderName.toLowerCase().includes(q) ||
        d.reason.toLowerCase().includes(q) ||
        d.processorDisputeId.toLowerCase().includes(q)
    );
  }

  // Hydrate relations
  return list.map((d) => hydrateDispute(d));
}

export async function getDisputeById(id: string): Promise<DisputeRecord | null> {
  const dispute = store.disputes.find((d) => d.id === id || d.externalDisputeId === id);
  if (!dispute) return null;
  return hydrateDispute(dispute);
}

function hydrateDispute(d: DisputeRecord): DisputeRecord {
  const customer = store.customers.find((c) => c.id === d.customerId);
  const order = store.orders.find((o) => o.id === d.orderId);
  const evidenceList = store.evidence.filter((e) => e.disputeId === d.id);

  return {
    ...d,
    customer,
    order,
    evidenceList,
  };
}

export async function updateDispute(
  id: string,
  updates: Partial<DisputeRecord>,
  auditInfo?: { actorName: string; actorRole: string; action: string; details: string }
): Promise<DisputeRecord | null> {
  const idx = store.disputes.findIndex((d) => d.id === id);
  if (idx === -1) return null;

  store.disputes[idx] = {
    ...store.disputes[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (auditInfo) {
    addAuditLog({
      organizationId: store.disputes[idx].organizationId,
      userName: auditInfo.actorName,
      userRole: auditInfo.actorRole,
      action: auditInfo.action,
      entityType: 'DISPUTE',
      entityId: id,
      details: auditInfo.details,
      ipAddress: '127.0.0.1',
    });
  }

  return hydrateDispute(store.disputes[idx]);
}

export async function addEvidence(
  evidence: Omit<EvidenceItem, 'id' | 'createdAt'>,
  auditInfo?: { actorName: string; actorRole: string }
): Promise<EvidenceItem> {
  const newEvidence: EvidenceItem = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    ...evidence,
  };

  store.evidence.push(newEvidence);

  if (auditInfo) {
    addAuditLog({
      organizationId: 'org-1',
      userName: auditInfo.actorName,
      userRole: auditInfo.actorRole,
      action: 'EVIDENCE_ADDED',
      entityType: 'EVIDENCE',
      entityId: newEvidence.id,
      details: `Added evidence "${newEvidence.title}" (${newEvidence.type}) for dispute ${newEvidence.disputeId}`,
      ipAddress: '127.0.0.1',
    });
  }

  return newEvidence;
}

export async function addAuditLog(
  log: Omit<AuditLogRecord, 'id' | 'createdAt'>
): Promise<AuditLogRecord> {
  const newLog: AuditLogRecord = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    ...log,
  };

  store.auditLogs.unshift(newLog);
  return newLog;
}

export async function addNotification(
  notif: Omit<NotificationItem, 'id' | 'createdAt'>
): Promise<NotificationItem> {
  const newNotif: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    ...notif,
  };

  store.notifications.unshift(newNotif);
  return newNotif;
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const item = store.notifications.find((n) => n.id === id);
  if (item) {
    item.read = true;
    return true;
  }
  return false;
}

export async function markAllNotificationsRead(): Promise<void> {
  for (const n of store.notifications) {
    n.read = true;
  }
}

export async function createDispute(data: {
  organizationId: string;
  orderId?: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  reason: string;
  processor: any;
  cardBrand?: any;
  cardLast4?: string;
}): Promise<DisputeRecord> {
  const disputeId = `dsp-${Date.now().toString().slice(-4)}`;
  const extDisputeId = `dp_${processorPrefix(data.processor)}_${Math.random().toString(36).substring(2, 10)}`;

  // Find or create customer
  let customer = store.customers.find((c) => c.email.toLowerCase() === data.customerEmail.toLowerCase());
  if (!customer) {
    customer = {
      id: `cust-${Date.now().toString().slice(-4)}`,
      organizationId: data.organizationId,
      email: data.customerEmail,
      name: data.customerName,
      phoneNumber: '+1 (555) 019-2831',
      address: '100 Innovation Way, Suite 400, Austin, TX 78701',
      totalOrdersCount: 1,
      lifetimeValue: data.amount,
      previousDisputesCount: 0,
      previousDisputesWon: 0,
      fraudRiskScore: 22,
      accountCreatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      hasAcceptedTos: true,
      tosAcceptedAt: new Date().toISOString(),
      tosVersion: 'v2026.1_standard',
      sessionLogs: [
        {
          id: `sess-${Date.now()}`,
          ipAddress: '64.233.160.1',
          location: 'Austin, TX, United States',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
          timestamp: new Date().toISOString(),
          action: 'Order Placed & Checkout Completed',
          deviceFingerprint: 'dfp_new_order_99',
        },
      ],
    };
    store.customers.push(customer);
  }

  // Create order
  const orderId = `ord-${Date.now().toString().slice(-4)}`;
  const order: OrderDetailData = {
    id: orderId,
    organizationId: data.organizationId,
    customerId: customer.id,
    externalOrderId: `ORD-${Date.now().toString().slice(-6)}`,
    amount: data.amount,
    currency: 'USD',
    status: 'completed',
    items: [
      {
        name: 'Enterprise Cloud Service Package',
        sku: 'SKU-ENT-PRO',
        quantity: 1,
        price: data.amount,
        type: 'subscription',
      },
    ],
    billingAddress: customer.address || '100 Innovation Way, Austin, TX',
    shippingAddress: customer.address || '100 Innovation Way, Austin, TX',
    avsResult: 'MATCH',
    cvcResult: 'MATCH',
    threeDSecure: 'AUTHENTICATED',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  };
  store.orders.push(order);

  const newDispute: DisputeRecord = {
    id: disputeId,
    organizationId: data.organizationId,
    orderId: order.id,
    customerId: customer.id,
    externalDisputeId: extDisputeId,
    processor: data.processor || 'stripe',
    processorDisputeId: extDisputeId,
    reason: data.reason,
    reasonCode: '10.4',
    amount: data.amount,
    feeAmount: 15.0,
    currency: 'USD',
    status: 'OPEN',
    deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    riskLevel: data.amount > 500 ? 'HIGH' : 'MEDIUM',
    cardBrand: data.cardBrand || 'visa',
    cardLast4: data.cardLast4 || '4242',
    cardholderName: data.customerName,
    evidenceStrengthScore: 75,
    winProbability: 70,
    rebuttalTone: 'firm',
    rebuttalLetter: `FORMAL REBUTTAL STATEMENT FOR ${data.reason.toUpperCase()}\n\nMerchant: Acme SaaS Corp\nDisputed Amount: $${data.amount.toFixed(2)} USD\nCardholder: ${data.customerName}\n\nEvidence and authorization records will follow upon completion of automated evidence collection.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.disputes.unshift(newDispute);

  // Auto-collect initial evidence items
  addEvidence({
    disputeId: newDispute.id,
    type: 'ORDER_DETAILS',
    title: `Order & Invoicing Record #${order.externalOrderId}`,
    content: `Order total $${data.amount.toFixed(2)} with itemized SKU-ENT-PRO. 3D-Secure 2.0 Authenticated.`,
    sourceIntegration: `${data.processor.toUpperCase()} API Connector`,
    isAutoCollected: true,
    confidenceScore: 95,
    isIncludedInSubmission: true,
    verifiedAt: new Date().toISOString(),
  });

  addEvidence({
    disputeId: newDispute.id,
    type: 'ACTIVITY_LOGS',
    title: `Customer IP & Device Fingerprint Log`,
    content: `Customer logged in from IP 64.233.160.1 matching billing region. AVS matched.`,
    sourceIntegration: `Session Telemetry Hub`,
    isAutoCollected: true,
    confidenceScore: 92,
    isIncludedInSubmission: true,
    verifiedAt: new Date().toISOString(),
  });

  addAuditLog({
    organizationId: data.organizationId,
    userName: 'Webhook / Manual Intake',
    userRole: 'DISPUTE_ANALYST',
    action: 'DISPUTE_CREATED',
    entityType: 'DISPUTE',
    entityId: newDispute.id,
    details: `Created new dispute ${newDispute.externalDisputeId} ($${data.amount}) for ${data.customerName}`,
    ipAddress: '127.0.0.1',
  });

  addNotification({
    organizationId: data.organizationId,
    title: `New Dispute Ingested: $${data.amount.toFixed(2)}`,
    message: `${data.customerName} filed a "${data.reason}" dispute via ${data.processor.toUpperCase()}.`,
    type: 'DISPUTE_NEW',
    severity: 'warning',
    read: false,
    linkUrl: `/disputes/${newDispute.id}`,
  });

  return hydrateDispute(newDispute);
}

function processorPrefix(p: string): string {
  switch (p) {
    case 'stripe': return 'strp';
    case 'shopify': return 'shp';
    case 'paypal': return 'pp';
    case 'adyen': return 'ady';
    default: return 'dsp';
  }
}

// Compatibility Drizzle ORM DB proxy
function createMockDb() {
  return {
    select: () => ({
      from: (table: any) => {
        let tableName = 'disputes';
        if (table === schema.disputes) tableName = 'disputes';
        else if (table === schema.customers) tableName = 'customers';
        else if (table === schema.orders) tableName = 'orders';
        else if (table === schema.evidence) tableName = 'evidence';
        else if (table === schema.auditLogs) tableName = 'audit_logs';
        else if (table === schema.integrations) tableName = 'integrations';

        let data: any[] = [];
        if (tableName === 'disputes') data = store.disputes.map((d) => hydrateDispute(d));
        else if (tableName === 'customers') data = store.customers;
        else if (tableName === 'orders') data = store.orders;
        else if (tableName === 'evidence') data = store.evidence;
        else if (tableName === 'audit_logs') data = store.auditLogs;
        else if (tableName === 'integrations') data = store.integrations;

        const promise = Promise.resolve([...data]);
        return Object.assign(promise, {
          where: (condition: any) => {
            let filtered = [...data];
            if (condition && condition.left && condition.right !== undefined) {
              const colName = condition.left.name || condition.left._?.name || condition.left.key;
              const val = condition.right?.value ?? condition.right;
              filtered = filtered.filter((row) => {
                const rowVal = row[colName] ?? row[condition.left.name] ?? row[condition.left];
                return String(rowVal) === String(val);
              });
            }
            return Promise.resolve(filtered);
          },
        });
      },
    }),
    insert: (table: any) => ({
      values: (val: any) => {
        const records = Array.isArray(val) ? val : [val];
        return Object.assign(Promise.resolve(records), {
          returning: () => Promise.resolve(records),
        });
      },
    }),
    update: (table: any) => ({
      set: (updates: any) => ({
        where: () => Promise.resolve([]),
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve([]),
    }),
    execute: async () => ({ rows: [] }),
  };
}

const databaseUrl = process.env.DATABASE_URL;
let pool: Pool | undefined;
let db: any;

if (databaseUrl) {
  try {
    const globalForDb = globalThis as typeof globalThis & {
      __arenaNextJsPostgresqlPool?: Pool;
    };
    pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
      });
    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = pool;
    }
    db = drizzle(pool, { schema });
  } catch {
    db = createMockDb();
  }
} else {
  db = createMockDb();
}

export { pool, db };
