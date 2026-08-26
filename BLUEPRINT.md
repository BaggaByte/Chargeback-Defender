# Chargeback Defender — AI Agent Implementation Blueprint

This document is structured for AI agent consumption. Each section contains executable specifications, schemas, and decision trees.

---

## 1. SYSTEM DEFINITION

```yaml
product_name: Chargeback Defender
domain: fintech / dispute management
architecture_pattern: event-driven microservices
critical_constraints:
  - deadline_driven: "Payment processor deadlines are hard (7-30 days)"
  - human_in_the_loop: "Every submission requires human approval"
  - audit_immutable: "Every action must be auditable"
  - revenue_model: "per_dispute_fee OR percentage_recovered"

core_workflow:
  1. ingest_alert        # Webhook from payment processor
  2. enrich_customer     # Link orders, sessions, delivery
  3. gather_evidence     # Pull from all connected systems
  4. ai_analyze          # Predict win probability, draft response
  5. human_review        # Pause workflow, notify via UI/Slack
  6. submit_evidence     # Format per processor, submit via API
  7. record_outcome      # Update ML model, improve future cases
```

---

## 2. SERVICE DECOMPOSITION

### 2.1 Service Registry

| Service ID | Language | Framework | Purpose | Scaling Trigger |
|------------|----------|-----------|---------|-----------------|
| `gateway` | Go | Fiber | Webhook ingestion, auth, rate limiting | CPU > 70% |
| `core-api` | Node.js | NestJS | Business logic, CRUD, GraphQL | Request queue > 1000 |
| `ai-engine` | Python | FastAPI | LLM inference, prediction, drafting | GPU utilization |
| `workflow` | Go | Temporal SDK | Durable execution, timers, human gates | Workflow backlog |
| `integration` | Node.js | NestJS | 3rd party API adapters | Per-integration limits |
| `billing` | Node.js | NestJS | Usage tracking, invoicing | Revenue events |
| `notification` | Node.js | NestJS | Email, Slack, in-app alerts | Notification queue |

### 2.2 Service Communication Matrix

```
┌──────────┬─────────┬──────────┬──────────┬────────────┬─────────┬──────────────┐
│          │gateway  │core-api  │ai-engine │workflow    │billing  │notification  │
├──────────┼─────────┼──────────┼──────────┼────────────┼─────────┼──────────────┤
│gateway   │ -       │ REST     │ -        │ Temporal   │ -       │ -            │
│core-api  │ -       │ -        │ gRPC     │ Temporal   │ REST    │ Event (Kafka)│
│ai-engine │ -       │ REST     │ -        │ -          │ -       │ -            │
│workflow  │ -       │ REST     │ gRPC     │ -          │ -       │ Event (Kafka)│
│billing   │ -       │ REST     │ -        │ -          │ -       │ -            │
│notification│ -     │ -        │ -        │ -          │ -       │ -            │
└──────────┴─────────┴──────────┴──────────┴────────────┴─────────┴──────────────┘
```

---

## 3. DATA MODELS (PostgreSQL Schema)

### 3.1 Core Entities

```sql
-- Customers (normalized across all stores)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL, -- Store's customer ID
    store_id UUID REFERENCES stores(id),
    email VARCHAR(255),
    phone VARCHAR(50),
    risk_score DECIMAL(3,2),
    dispute_count INT DEFAULT 0,
    win_count INT DEFAULT 0,
    loss_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(external_id, store_id)
);

-- Stores (tenants)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50), -- shopify, woocommerce, custom
    processor VARCHAR(50), -- stripe, paypal, adyen
    api_credentials JSONB ENCRYPTED, -- encrypted at application layer
    billing_plan VARCHAR(20), -- per_dispute, percentage
    billing_rate DECIMAL(5,4), -- 0.1500 = 15%
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disputes (central entity)
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    customer_id UUID REFERENCES customers(id),
    
    -- Processor data
    processor VARCHAR(50) NOT NULL,
    processor_dispute_id VARCHAR(255) NOT NULL,
    processor_charge_id VARCHAR(255),
    amount DECIMAL(12,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    reason VARCHAR(50), -- fraudulent, product_not_received, etc.
    status VARCHAR(20) DEFAULT 'open', -- open, evidence_submitted, won, lost, expired
    
    -- Timeline (CRITICAL)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    evidence_due_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- AI/Workflow
    ai_win_probability DECIMAL(3,2),
    ai_recommended_strategy VARCHAR(50),
    ai_drafted_response TEXT,
    
    -- Human review
    assigned_to UUID REFERENCES users(id),
    review_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, needs_info
    reviewer_notes TEXT,
    
    -- Outcome
    outcome VARCHAR(20), -- won, lost, accepted
    recovered_amount DECIMAL(12,2),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    UNIQUE(processor, processor_dispute_id)
);

CREATE INDEX idx_disputes_due_date ON disputes(evidence_due_at) WHERE status = 'open';
CREATE INDEX idx_disputes_store ON disputes(store_id, created_at DESC);
CREATE INDEX idx_disputes_customer ON disputes(customer_id);

-- Orders (linked to disputes)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    customer_id UUID REFERENCES customers(id),
    dispute_id UUID REFERENCES disputes(id),
    
    external_order_id VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2),
    currency CHAR(3),
    status VARCHAR(20), -- fulfilled, shipped, delivered, refunded
    shipping_carrier VARCHAR(50),
    tracking_number VARCHAR(100),
    delivered_at TIMESTAMPTZ,
    proof_of_delivery_url TEXT,
    
    order_data JSONB, -- raw order payload
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence (attached to disputes)
CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES disputes(id),
    type VARCHAR(50), -- order_receipt, tracking, customer_communication, session_recording, refund_policy
    source VARCHAR(50), -- shopify, stripe, email, fullstory
    content TEXT, -- text content or URL
    file_url TEXT,
    file_hash VARCHAR(64), -- SHA-256 for integrity
    is_submitted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (user behavior data)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    dispute_id UUID REFERENCES disputes(id),
    
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    geo_country CHAR(2),
    
    -- Key events
    login_at TIMESTAMPTZ,
    checkout_at TIMESTAMPTZ,
    download_at TIMESTAMPTZ,
    
    session_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log (immutable)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50), -- dispute, evidence, user_action
    entity_id UUID,
    action VARCHAR(50), -- created, updated, submitted, approved
    performed_by UUID REFERENCES users(id),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (internal team)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20), -- admin, reviewer, viewer
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Time-Series Schema (ClickHouse)

```sql
CREATE TABLE dispute_events (
    event_id UUID,
    dispute_id UUID,
    event_type String, -- alert_received, evidence_gathered, ai_analyzed, human_approved, submitted, resolved
    payload String, -- JSON
    created_at DateTime64(3),
    
    INDEX idx_dispute (dispute_id) TYPE bloom_filter GRANULARITY 3,
    INDEX idx_type (event_type) TYPE bloom_filter GRANULARITY 3
) ENGINE = MergeTree()
ORDER BY (dispute_id, created_at);
```

---

## 4. API SPECIFICATIONS

### 4.1 Webhook Ingestion (Gateway Service)

```yaml
# POST /v1/webhooks/{processor}
# Processors: stripe, paypal, adyen, braintree

endpoint: POST /v1/webhooks/stripe
headers:
  Stripe-Signature: string (HMAC verification)
body:
  type: string  # e.g., "charge.dispute.created"
  data:
    object:
      id: string  # dispute ID
      charge: string
      amount: integer  # cents
      currency: string
      reason: string
      evidence_details:
        due_by: integer  # Unix timestamp
      status: string

response:
  200: { received: true }
  400: { error: "invalid_signature" }
  409: { error: "dispute_already_exists" }

# Implementation rules:
# 1. Verify webhook signature immediately
# 2. Return 200 within 2 seconds (processor timeout)
# 3. Push to Kafka topic "dispute.alerts" for async processing
# 4. Do NOT process synchronously
```

### 4.2 Core API (REST + GraphQL)

```graphql
# GraphQL Schema (for Dashboard)

type Dispute {
  id: ID!
  store: Store!
  customer: Customer!
  amount: Float!
  currency: String!
  reason: DisputeReason!
  status: DisputeStatus!
  evidenceDueAt: DateTime!
  evidence: [Evidence!]!
  aiAnalysis: AIAnalysis
  reviewStatus: ReviewStatus!
  assignedTo: User
  outcome: Outcome
  createdAt: DateTime!
  updatedAt: DateTime!
}

type AIAnalysis {
  winProbability: Float!
  recommendedStrategy: String!
  draftedResponse: String
  keyEvidence: [String!]!
  riskFactors: [String!]!
}

enum DisputeReason {
  FRAUDULENT
  PRODUCT_NOT_RECEIVED
  PRODUCT_UNACCEPTABLE
  DUPLICATE
  SUBSCRIPTION_CANCELED
  CREDIT_NOT_PROCESSED
  GENERAL
}

enum DisputeStatus {
  OPEN
  EVIDENCE_GATHERING
  READY_FOR_REVIEW
  EVIDENCE_SUBMITTED
  WON
  LOST
  EXPIRED
}

type Query {
  disputes(
    storeId: ID
    status: DisputeStatus
    assignedTo: ID
    dueBefore: DateTime
    page: Int = 1
    limit: Int = 20
  ): DisputeConnection!
  
  dispute(id: ID!): Dispute
  dashboardMetrics(storeId: ID, period: DateRange!): DashboardMetrics!
}

type Mutation {
  approveDispute(id: ID!, notes: String): Dispute!
  rejectDispute(id: ID!, notes: String!): Dispute!
  requestMoreInfo(id: ID!, requestedEvidence: [String!]!): Dispute!
  submitEvidence(id: ID!): Dispute!  # Triggered after approval
  assignDispute(id: ID!, userId: ID!): Dispute!
}

type Subscription {
  disputeUpdated(storeId: ID): Dispute!
  newDisputeAlert(storeId: ID): Dispute!
}
```

### 4.3 AI Engine API (FastAPI)

```python
# POST /v1/analyze
# Request
{
  "dispute_id": "uuid",
  "processor": "stripe",
  "reason": "fraudulent",
  "amount": 15000,
  "currency": "usd",
  "customer_history": {
    "total_orders": 5,
    "total_disputes": 1,
    "previous_wins": 0,
    "account_age_days": 120
  },
  "evidence": [
    {"type": "order_receipt", "content": "..."},
    {"type": "tracking", "content": "..."},
    {"type": "customer_communication", "content": "..."}
  ],
  "session_data": {
    "ip_country": "US",
    "device_fingerprint": "abc123",
    "checkout_time_seconds": 45
  }
}

# Response
{
  "win_probability": 0.78,
  "confidence": "high",
  "recommended_strategy": "comprehensive_evidence",
  "drafted_response": "string",  # Formatted per processor
  "key_evidence": ["tracking", "device_fingerprint"],
  "missing_evidence": ["signed_delivery_confirmation"],
  "risk_factors": ["new_account", "high_value"]
}

# POST /v1/predict-outcome (for historical data training)
# GET /v1/health
```

---

## 5. TEMPORAL WORKFLOW DEFINITION

```typescript
// dispute.workflow.ts
// Temporal TypeScript SDK

interface DisputeWorkflowInput {
  disputeId: string;
  processor: string;
  evidenceDueAt: Date;
  storeId: string;
}

interface DisputeWorkflowOutput {
  disputeId: string;
  status: 'submitted' | 'expired' | 'accepted_loss';
  submittedAt?: Date;
  outcome?: 'won' | 'lost';
}

// Main workflow
export async function disputeWorkflow(input: DisputeWorkflowInput): Promise<DisputeWorkflowOutput> {
  const { disputeId, evidenceDueAt, storeId } = input;
  
  // Calculate deadlines (buffer before actual due date)
  const evidenceGatheringDeadline = subHours(evidenceDueAt, 72);  // 3 days buffer
  const humanReviewDeadline = subHours(evidenceDueAt, 24);        // 1 day buffer
  
  // Step 1: Enrich customer data (compensate if fails)
  try {
    await executeChild(enrichCustomerWorkflow, { args: [disputeId] });
  } catch (error) {
    await compensateEnrichment(disputeId);
    throw error;
  }
  
  // Step 2: Gather evidence from all systems (parallel)
  const evidenceResults = await Promise.all([
    executeChild(gatherOrderEvidence, { args: [disputeId] }),
    executeChild(gatherSessionEvidence, { args: [disputeId] }),
    executeChild(gatherDeliveryEvidence, { args: [disputeId] }),
    executeChild(gatherCommunicationEvidence, { args: [disputeId] })
  ]);
  
  // Step 3: AI Analysis
  const aiAnalysis = await executeChild(aiAnalysisWorkflow, { 
    args: [disputeId, evidenceResults],
    retry: { maximumAttempts: 3, backoffCoefficient: 2 }
  });
  
  // Step 4: Human Review Gate (CRITICAL - blocks until approved)
  // Send notification
  await notifyReviewers(disputeId, aiAnalysis);
  
  // Wait for human approval or until deadline approaches
  const approval = await Promise.race([
    waitForHumanApproval(disputeId),
    sleepUntil(humanReviewDeadline).then(() => ({ approved: false, reason: 'deadline_approaching' }))
  ]);
  
  if (!approval.approved) {
    if (approval.reason === 'deadline_approaching') {
      // Auto-escalate to senior reviewer
      await escalateDispute(disputeId, 'deadline_approaching');
      const seniorApproval = await waitForHumanApproval(disputeId, { seniorOnly: true });
      if (!seniorApproval.approved) {
        return { disputeId, status: 'accepted_loss' };
      }
    } else {
      return { disputeId, status: 'accepted_loss' };
    }
  }
  
  // Step 5: Format and submit evidence
  const submission = await executeChild(submitEvidenceWorkflow, {
    args: [disputeId, approval.reviewerNotes],
    retry: { maximumAttempts: 5, initialInterval: '1 minute' }
  });
  
  // Step 6: Record outcome (async, waits for processor webhook)
  await waitForOutcome(disputeId);
  
  return {
    disputeId,
    status: 'submitted',
    submittedAt: new Date()
  };
}

// Activity definitions (implemented in respective services)
const activities = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: { maximumAttempts: 3 }
});

async function enrichCustomerWorkflow(disputeId: string) {
  // Call core-api to fetch and link customer data
  await activities.enrichCustomer(disputeId);
}

async function gatherOrderEvidence(disputeId: string) {
  // Fetch from Shopify/WooCommerce
  await activities.fetchOrderEvidence(disputeId);
}

async function gatherSessionEvidence(disputeId: string) {
  // Fetch from Segment/FullStory
  await activities.fetchSessionEvidence(disputeId);
}

async function gatherDeliveryEvidence(disputeId: string) {
  // Fetch from EasyPost/carriers
  await activities.fetchDeliveryEvidence(disputeId);
}

async function gatherCommunicationEvidence(disputeId: string) {
  // Fetch from email/Help Scout
  await activities.fetchCommunicationEvidence(disputeId);
}

async function aiAnalysisWorkflow(disputeId: string, evidence: any[]) {
  // Call ai-engine service
  return await activities.analyzeWithAI(disputeId, evidence);
}

async function notifyReviewers(disputeId: string, analysis: any) {
  await activities.sendNotification({
    type: 'dispute_ready_for_review',
    disputeId,
    priority: analysis.winProbability > 0.7 ? 'high' : 'normal',
    channels: ['slack', 'email', 'in_app']
  });
}

async function waitForHumanApproval(disputeId: string, options?: { seniorOnly?: boolean }) {
  // Temporal signal handler - blocks until human sends approval signal
  return await workflow.waitForSignal('humanApproval', options);
}

async function submitEvidenceWorkflow(disputeId: string, reviewerNotes: string) {
  // Format per processor and submit
  return await activities.submitToProcessor(disputeId, reviewerNotes);
}

async function waitForOutcome(disputeId: string) {
  // Wait for processor outcome webhook (up to 90 days)
  // Temporal can sleep for months efficiently
  return await workflow.waitForSignal('processorOutcome', { timeout: '90 days' });
}
```

---

## 6. INTEGRATION ADAPTERS

### 6.1 Payment Processor Adapters

```typescript
// Base interface
interface ProcessorAdapter {
  verifyWebhook(signature: string, payload: string, secret: string): boolean;
  parseDisputeAlert(payload: any): DisputeAlert;
  formatEvidence(dispute: Dispute, evidence: Evidence[]): ProcessorEvidenceFormat;
  submitEvidence(disputeId: string, formattedEvidence: any): Promise<SubmissionResult>;
  checkDisputeStatus(disputeId: string): Promise<DisputeStatus>;
}

// Stripe Adapter
class StripeAdapter implements ProcessorAdapter {
  verifyWebhook(signature: string, payload: string, secret: string): boolean {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }
  
  parseDisputeAlert(payload: any): DisputeAlert {
    return {
      processorDisputeId: payload.data.object.id,
      chargeId: payload.data.object.charge,
      amount: payload.data.object.amount, // cents
      currency: payload.data.object.currency,
      reason: this.mapReason(payload.data.object.reason),
      evidenceDueAt: new Date(payload.data.object.evidence_details.due_by * 1000),
      status: payload.data.object.status
    };
  }
  
  formatEvidence(dispute: Dispute, evidence: Evidence[]): StripeEvidenceFormat {
    // Stripe requires specific fields:
    // access_activity_log, billing_address, cancellation_policy, etc.
    return {
      access_activity_log: this.findEvidence(evidence, 'session_recording'),
      billing_address: this.findEvidence(evidence, 'billing_address'),
      cancellation_policy: this.findEvidence(evidence, 'cancellation_policy'),
      customer_communication: this.findEvidence(evidence, 'customer_communication'),
      customer_email_address: dispute.customer.email,
      customer_name: dispute.customer.name,
      customer_purchase_ip: this.findEvidence(evidence, 'ip_address'),
      customer_signature: this.findEvidence(evidence, 'customer_signature'),
      duplicate_charge_documentation: this.findEvidence(evidence, 'duplicate_charge'),
      receipt: this.findEvidence(evidence, 'order_receipt'),
      refund_policy: this.findEvidence(evidence, 'refund_policy'),
      service_date: this.findEvidence(evidence, 'service_date'),
      shipping_address: this.findEvidence(evidence, 'shipping_address'),
      shipping_carrier: this.findEvidence(evidence, 'shipping_carrier'),
      shipping_date: this.findEvidence(evidence, 'shipping_date'),
      shipping_documentation: this.findEvidence(evidence, 'shipping_documentation'),
      shipping_tracking_number: this.findEvidence(evidence, 'tracking_number'),
      uncategorized_file: this.findEvidence(evidence, 'additional_documentation'),
      uncategorized_text: this.compileAdditionalNotes(dispute, evidence)
    };
  }
  
  async submitEvidence(disputeId: string, evidence: StripeEvidenceFormat): Promise<SubmissionResult> {
    const result = await stripe.disputes.update(disputeId, { evidence });
    return {
      success: true,
      submittedAt: new Date(),
      processorResponse: result
    };
  }
  
  private mapReason(stripeReason: string): DisputeReason {
    const mapping: Record<string, DisputeReason> = {
      'fraudulent': DisputeReason.FRAUDULENT,
      'product_not_received': DisputeReason.PRODUCT_NOT_RECEIVED,
      'product_unacceptable': DisputeReason.PRODUCT_UNACCEPTABLE,
      'duplicate': DisputeReason.DUPLICATE,
      'subscription_canceled': DisputeReason.SUBSCRIPTION_CANCELED,
      'credit_not_processed': DisputeReason.CREDIT_NOT_PROCESSED
    };
    return mapping[stripeReason] || DisputeReason.GENERAL;
  }
}

// PayPal Adapter (different API structure)
class PayPalAdapter implements ProcessorAdapter {
  // Similar pattern but PayPal-specific fields
  // ...
}
```

### 6.2 E-commerce Platform Adapters

```typescript
interface EcommerceAdapter {
  fetchOrder(orderId: string, credentials: StoreCredentials): Promise<Order>;
  fetchCustomer(customerId: string, credentials: StoreCredentials): Promise<Customer>;
  fetchFulfillment(orderId: string, credentials: StoreCredentials): Promise<Fulfillment>;
  verifyWebhook(signature: string, payload: string, secret: string): boolean;
}

// Shopify Adapter
class ShopifyAdapter implements EcommerceAdapter {
  private graphqlEndpoint: string;
  
  async fetchOrder(orderId: string, credentials: StoreCredentials): Promise<Order> {
    const query = `
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          name
          email
          phone
          totalPriceSet { shopMoney { amount currencyCode } }
          lineItems(first: 50) {
            edges {
              node {
                title
                quantity
                variant { sku }
              }
            }
          }
          shippingAddress { ... }
          fulfillments {
            trackingInfo { company number }
            deliveredAt
          }
        }
      }
    `;
    
    const response = await fetch(this.graphqlEndpoint, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': credentials.accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables: { id: orderId } })
    });
    
    return this.transformShopifyOrder(await response.json());
  }
}
```

---

## 7. AI/ML PIPELINE SPECIFICATION

### 7.1 Feature Engineering

```python
# features.py
# Features extracted for win/loss prediction

DISPUTE_FEATURES = {
    # Dispute characteristics
    'amount': 'float',  # Normalized
    'reason_encoded': 'categorical',
    'days_to_deadline': 'int',
    
    # Customer history
    'customer_age_days': 'int',
    'customer_order_count': 'int',
    'customer_dispute_rate': 'float',  # disputes / orders
    'customer_previous_win_rate': 'float',
    
    # Evidence completeness
    'evidence_count': 'int',
    'has_tracking': 'bool',
    'has_delivery_proof': 'bool',
    'has_customer_communication': 'bool',
    'has_session_data': 'bool',
    'has_refund_policy': 'bool',
    
    # Session signals
    'checkout_duration_seconds': 'float',
    'ip_country_matches_billing': 'bool',
    'device_fingerprint_risk_score': 'float',
    'is_vpn': 'bool',
    'is_tor': 'bool',
    
    # Order signals
    'order_fulfillment_time_hours': 'float',
    'shipping_matches_billing': 'bool',
    'high_value_flag': 'bool',  # > $500
}

# Feature store schema (Feast)
class DisputeFeatureView(FeatureView):
    name = "dispute_features"
    entities = ["dispute_id"]
    ttl = timedelta(days=90)
    schema = [
        Field(name="amount", dtype=Float32),
        Field(name="customer_dispute_rate", dtype=Float32),
        Field(name="evidence_completeness_score", dtype=Float32),
        Field(name="has_tracking", dtype=Bool),
        Field(name="win_probability", dtype=Float32),
    ]
    online = True
    source = dispute_source
```

### 7.2 LLM Prompts for Evidence Drafting

```python
# prompts.py

DISPUTE_RESPONSE_PROMPT = """
You are an expert chargeback dispute analyst. Draft a compelling evidence submission 
for a {processor} dispute.

DISPUTE DETAILS:
- Reason: {reason}
- Amount: {amount} {currency}
- Customer: {customer_email}
- Order Date: {order_date}

EVIDENCE SUMMARY:
{evidence_summary}

CUSTOMER HISTORY:
{customer_history}

INSTRUCTIONS:
1. Address the specific dispute reason directly
2. Reference concrete evidence (tracking numbers, timestamps, IP addresses)
3. Be factual and concise - processors value clarity over length
4. Highlight customer behavior that indicates legitimate transaction
5. Include specific policy references if applicable

FORMAT: Structured response suitable for {processor} evidence fields.
"""

EVIDENCE_ANALYSIS_PROMPT = """
Analyze the following dispute evidence and identify:
1. Strengths (what will help win)
2. Weaknesses (what's missing or problematic)
3. Recommended strategy
4. Win probability (0.0-1.0)

Evidence: {evidence_json}
Reason: {dispute_reason}
Amount: {amount}
"""
```

### 7.3 Model Training Pipeline

```yaml
# ml_pipeline.yaml (Airflow DAG)

dag_id: dispute_model_retraining
schedule_interval: 0 2 * * 0  # Weekly on Sunday 2 AM
tasks:
  1_extract_features:
    operator: PythonOperator
    python_callable: extract_training_features
    config:
      lookback_days: 180
      min_samples: 500
      
  2_train_model:
    operator: PythonOperator
    python_callable: train_xgboost_model
    config:
      model_type: binary_classification
      target: outcome (won=1, lost=0)
      test_size: 0.2
      hyperparameters:
        max_depth: [3, 5, 7]
        learning_rate: [0.01, 0.1]
        n_estimators: [100, 200]
        
  3_evaluate:
    operator: PythonOperator
    python_callable: evaluate_model
    thresholds:
      accuracy: 0.75
      precision: 0.70
      recall: 0.65
      
  4_register_model:
    operator: PythonOperator
    python_callable: register_to_mlflow
    condition: "{{ ti.xcom_pull(task_ids='evaluate')['passed'] }}"
    
  5_deploy:
    operator: PythonOperator
    python_callable: deploy_to_sagemaker
    condition: "{{ ti.xcom_pull(task_ids='evaluate')['passed'] }}"
```

---

## 8. EVENT SCHEMA (Kafka Topics)

```yaml
topics:
  dispute.alerts:
    partitions: 12
    replication: 3
    schema:
      event_id: UUID
      processor: string
      payload: JSON  # Raw webhook payload
      received_at: timestamp
      
  dispute.enriched:
    partitions: 12
    schema:
      dispute_id: UUID
      customer_id: UUID
      order_ids: UUID[]
      evidence_types: string[]
      enriched_at: timestamp
      
  dispute.ai_analyzed:
    partitions: 6
    schema:
      dispute_id: UUID
      win_probability: float
      strategy: string
      drafted_response: string
      analyzed_at: timestamp
      
  dispute.human_action:
    partitions: 6
    schema:
      dispute_id: UUID
      action: enum [approved, rejected, needs_info]
      user_id: UUID
      notes: string
      acted_at: timestamp
      
  dispute.submitted:
    partitions: 6
    schema:
      dispute_id: UUID
      processor: string
      submitted_evidence: JSON
      submitted_at: timestamp
      
  dispute.resolved:
    partitions: 6
    schema:
      dispute_id: UUID
      outcome: enum [won, lost]
      recovered_amount: float
      resolved_at: timestamp
      
  billing.dispute_processed:
    partitions: 6
    schema:
      dispute_id: UUID
      store_id: UUID
      fee_type: enum [per_dispute, percentage]
      fee_amount: float
      processed_at: timestamp
```

---

## 9. INFRASTRUCTURE AS CODE (Terraform)

```hcl
# main.tf - Core infrastructure

# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "chargeback-defender"
  cluster_version = "1.30"

  cluster_addons = {
    coredns    = { most_recent = true }
    kube-proxy = { most_recent = true }
    vpc-cni    = { most_recent = true }
  }

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10

      instance_types = ["m6i.xlarge"]
      capacity_type  = "ON_DEMAND"
    }
    
    gpu = {
      desired_size = 1
      min_size     = 0
      max_size     = 3
      
      instance_types = ["g5.xlarge"]  # For AI inference
      capacity_type  = "ON_DEMAND"
      taints = [{
        key    = "nvidia.com/gpu"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}

# RDS PostgreSQL
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "chargeback-defender-db"

  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = "db.r6g.xlarge"
  allocated_storage    = 100

  db_name  = "chargeback_defender"
  username = "db_admin"
  port     = 5432

  multi_az               = true
  deletion_protection    = true
  storage_encrypted      = true
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  performance_insights_enabled = true
  
  # Enable pgvector extension
  parameter_group_name = aws_db_parameter_group.pgvector.name
}

# ElastiCache Redis
module "redis" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.0"

  cluster_id           = "chargeback-defender"
  engine               = "redis"
  engine_version       = "7.1"
  node_type            = "cache.r6g.large"
  num_cache_nodes      = 2
  
  automatic_failover_enabled = true
  multi_az_enabled           = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

# MSK (Kafka)
module "msk" {
  source  = "terraform-aws-modules/msk/aws"
  version = "~> 1.0"

  cluster_name    = "chargeback-defender"
  kafka_version   = "3.6.0"
  
  broker_node_instance_type = "kafka.m5.large"
  broker_node_storage_info = {
    ebs_storage_info = { volume_size = 100 }
  }
  
  number_of_broker_nodes = 3
}

# S3 for Evidence Storage
resource "aws_s3_bucket" "evidence" {
  bucket = "chargeback-defender-evidence"
}

resource "aws_s3_bucket_versioning" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  
  rule {
    id     = "archive-old-evidence"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 2555  # 7 years for legal compliance
    }
  }
}
```

---

## 10. IMPLEMENTATION PHASES

### Phase 1: Foundation (Weeks 1-4)
```yaml
deliverables:
  - PostgreSQL schema deployed
  - Gateway service (Go) - webhook ingestion only
  - Core API (NestJS) - basic CRUD for disputes
  - Stripe webhook integration
  - Simple dashboard (Next.js) - dispute list view
  - Temporal workflow - basic dispute lifecycle (no AI)
success_criteria:
  - Can receive Stripe dispute webhooks
  - Can display disputes in dashboard
  - Can manually mark disputes as won/lost
```

### Phase 2: Evidence Gathering (Weeks 5-8)
```yaml
deliverables:
  - Shopify integration adapter
  - Order/Delivery evidence auto-gathering
  - Evidence attachment UI
  - Basic evidence formatting for Stripe
success_criteria:
  - Auto-links orders to disputes
  - Auto-fetches tracking information
  - Can submit basic evidence to Stripe
```

### Phase 3: AI Integration (Weeks 9-12)
```yaml
deliverables:
  - AI Engine service (FastAPI)
  - LLM integration (Claude/GPT-4)
  - Win probability prediction
  - Auto-drafted response generation
  - Human review workflow (Temporal signals)
success_criteria:
  - AI analyzes disputes within 30 seconds
  - Human can approve/reject AI draft
  - Win probability displayed in dashboard
```

### Phase 4: Scale & Optimize (Weeks 13-16)
```yaml
deliverables:
  - PayPal + Adyen processor support
  - WooCommerce + BigCommerce adapters
  - ML model training pipeline
  - Advanced analytics dashboard
  - Billing engine integration
success_criteria:
  - Supports 3+ processors
  - ML model accuracy > 75%
  - Can bill customers automatically
```

---

## 11. CONFIGURATION SPECIFICATION

```yaml
# config.yaml - Runtime configuration

app:
  name: chargeback-defender
  environment: production
  log_level: info

database:
  postgres:
    host: "${RDS_ENDPOINT}"
    port: 5432
    database: chargeback_defender
    pool_size: 20
    ssl_mode: require
    
  clickhouse:
    host: "${CLICKHOUSE_ENDPOINT}"
    port: 8123
    database: analytics
    
  redis:
    host: "${REDIS_ENDPOINT}"
    port: 6379
    cluster_mode: true

temporal:
  host: "${TEMPORAL_HOST}:7233"
  namespace: chargeback-defender
  task_queue: dispute-workflows

kafka:
  brokers: "${MSK_BROKERS}"
  client_id: chargeback-defender
  security_protocol: SASL_SSL

ai:
  provider: anthropic  # or openai
  model: claude-3-5-sonnet-20241022
  max_tokens: 4000
  temperature: 0.3  # Low for factual consistency
  
  fallback:
    provider: openai
    model: gpt-4o
    
  local_model:
    enabled: true
    endpoint: http://vllm-service:8000
    model: meta-llama/Meta-Llama-3.1-70B-Instruct

processors:
  stripe:
    webhook_secret: "${STRIPE_WEBHOOK_SECRET}"
    api_key: "${STRIPE_API_KEY}"
    
  paypal:
    client_id: "${PAYPAL_CLIENT_ID}"
    client_secret: "${PAYPAL_CLIENT_SECRET}"
    webhook_id: "${PAYPAL_WEBHOOK_ID}"

integrations:
  shopify:
    api_version: "2024-01"
    rate_limit: 2  # requests per second
    
  easypost:
    api_key: "${EASYPOST_API_KEY}"

billing:
  default_plan: per_dispute
  per_dispute_fee: 2500  # cents = $25.00
  percentage_rate: 0.15  # 15%
  
security:
  encryption_key: "${ENCRYPTION_KEY}"  # AES-256 for PII
  jwt_secret: "${JWT_SECRET}"
  mfa_required: true
  session_timeout_minutes: 30
```

---

## 12. TESTING STRATEGY

```yaml
test_suites:
  unit:
    coverage_target: 80%
    frameworks: [jest, pytest, go-test]
    scope: individual functions, adapters, formatters
    
  integration:
    scope: service-to-service communication
    tools: [testcontainers, docker-compose]
    databases: [postgres, redis, kafka]
    
  e2e:
    scope: full dispute lifecycle
    tools: [playwright, cypress]
    scenarios:
      - "Stripe dispute received → evidence gathered → AI analyzed → human approved → submitted → won"
      - "PayPal dispute received → missing evidence → human requests more info → resubmitted → lost"
      
  load:
    target: 1000 webhooks/second
    tools: [k6, artillery]
    scenarios:
      - "Burst of 10,000 Stripe webhooks"
      - "100 concurrent human review actions"
      
  chaos:
    tools: [chaos-mesh, gremlin]
    scenarios:
      - "Postgres failover during workflow execution"
      - "Kafka partition loss"
      - "Temporal server restart"
```

---

## 13. MONITORING & ALERTING

```yaml
metrics:
  business:
    - disputes_per_hour
    - average_time_to_submit
    - win_rate_by_processor
    - revenue_recovered
    - ai_accuracy
    
  technical:
    - webhook_processing_latency_p99
    - workflow_completion_rate
    - database_connection_pool_usage
    - kafka_consumer_lag
    - ai_inference_latency
    
  critical_alerts:
    - name: "Dispute Deadline Approaching"
      condition: "dispute.due_in_hours < 24 AND status != 'submitted'"
      severity: critical
      action: "page_oncall + escalate_to_senior_reviewer"
      
    - name: "Webhook Processing Lag"
      condition: "kafka_consumer_lag > 1000"
      severity: warning
      action: "auto_scale_gateway_workers"
      
    - name: "AI Service Down"
      condition: "ai_engine_health == false"
      severity: warning
      action: "fallback_to_rule_based_drafting"
      
    - name: "Database Connection Exhaustion"
      condition: "postgres_connections > 90%"
      severity: critical
      action: "page_oncall + enable_connection_pooling"
```

---

## 14. SECURITY CHECKLIST

```yaml
authentication:
  - [ ] OAuth 2.0 / OIDC for dashboard
  - [ ] API keys for service-to-service
  - [ ] Webhook signature verification for all processors
  - [ ] MFA enforced for all users
  
authorization:
  - [ ] RBAC with dispute-level permissions
  - [ ] Store-level data isolation (multi-tenant)
  - [ ] Field-level encryption for PII
  
data_protection:
  - [ ] AES-256 encryption at rest (RDS TDE, S3 SSE-KMS)
  - [ ] TLS 1.3 in transit
  - [ ] PII tokenization where possible
  - [ ] Automated data retention (7 years evidence, 3 years logs)
  
compliance:
  - [ ] PCI DSS SAQ-A (use Stripe Elements, never touch raw cards)
  - [ ] SOC 2 Type II controls
  - [ ] GDPR data deletion support
  - [ ] Audit log immutability
  
infrastructure:
  - [ ] WAF rules for common attacks
  - [ ] DDoS protection (Cloudflare/AWS Shield)
  - [ ] VPC isolation for databases
  - [ ] Secrets management (Vault/AWS Secrets Manager)
  - [ ] Container image scanning
  - [ ] Dependency vulnerability scanning
```

---

## 15. DEPLOYMENT SEQUENCE

```bash
# Step-by-step deployment order for AI agent execution

# 1. Infrastructure
terraform init && terraform apply -target=module.vpc
terraform apply -target=module.eks
terraform apply -target=module.rds
terraform apply -target=module.redis
terraform apply -target=module.msk
terraform apply -target=module.s3

# 2. Database Schema
psql -h $RDS_ENDPOINT -U db_admin -f schema/001_initial.sql

# 3. Temporal Server
helm install temporal temporal/temporal \
  --namespace temporal \
  --create-namespace \
  --set elasticsearch.enabled=true

# 4. Core Services (in order)
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/gateway-deployment.yaml
kubectl apply -f k8s/core-api-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
kubectl apply -f k8s/ai-engine-deployment.yaml

# 5. Frontend
vercel --prod  # or kubectl apply -f k8s/frontend-deployment.yaml

# 6. Monitoring
kubectl apply -f k8s/monitoring/

# 7. Verify
./scripts/health-check.sh
./scripts/smoke-test.sh
```

---

## 16. DECISION LOG

| Decision | Choice | Alternatives Rejected | Rationale |
|----------|--------|----------------------|-----------|
| Workflow Engine | Temporal | Cadence, Airflow, custom queues | Durable execution with human-in-the-loop support |
| Primary Language | Go + Node.js + Python | Pure TypeScript, Java, Rust | Go for performance, Node for ecosystem, Python for ML |
| Database | PostgreSQL | MySQL, CockroachDB | pgvector extension, mature ecosystem, RDS managed |
| Event Streaming | Kafka | RabbitMQ, NATS | High throughput, replay capability, MSK managed |
| AI Provider | Anthropic Claude | GPT-4, local only | Better reasoning for legal/financial text |
| Frontend Hosting | Vercel | Self-hosted, Netlify | Edge deployment, ISR, team familiarity |
| Cache | Redis | Memcached, DynamoDB | Pub/sub for notifications, sorted sets for deadlines |

---

**This blueprint is ready for AI agent implementation. Each section contains executable specifications, schemas, and configurations that can be directly translated into code, infrastructure, and deployment pipelines.**
