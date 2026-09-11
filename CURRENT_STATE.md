# Current State of the Chargeback Defender Platform

This document provides a comprehensive technical audit of the current state of the **Chargeback Defender** platform codebase, detailing its architecture, implemented capabilities, database models, AI pipelines, and how it reconciles with the target specifications outlined in `BLUEPRINT.md`.

---

## 1. Executive Summary & Architecture Paradigm

| Dimension | Target Blueprint (`BLUEPRINT.md`) | Current Repository State |
| :--- | :--- | :--- |
| **System Pattern** | Distributed Event-Driven Microservices | High-performance Full-Stack Monolith |
| **Core Framework** | Go (Gateway), NestJS (Core API), Python (AI) | Next.js 16.2 (App Router) + React 19 |
| **Database & ORM** | Raw PostgreSQL + ClickHouse | PostgreSQL via Drizzle ORM + In-Memory Fallback State |
| **AI Orchestration** | FastAPI + Anthropic Claude / vLLM Llama 3.1 | Dual Tier: RocketRide `.pipe` Pipeline + Google Gemini (`@google/genai`) / Heuristic Engine |
| **Workflow Engine** | Temporal (Go / TS SDK) | Next.js Asynchronous Lifecycle & Human-in-the-Loop Approval |
| **Event Bus** | Apache Kafka / AWS MSK | Internal Next.js Route Handlers & Webhook Receivers |

---

## 2. Technology Stack & Runtime Environment

### Frontend & Dashboard
- **Framework:** Next.js 16.2.6 (React 19.2.6, Server and Client Components)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`), `tailwind-merge`, `clsx`
- **Component Libraries & Icons:** Lucide React icons, Framer Motion (`framer-motion` & `motion` v13)
- **Data Visualization:** Recharts v3 (`recharts`) for dispute volume, win rate tracking, and ROI projections
- **Typography & Assets:** Next.js font optimization (`Geist`, `Geist_Mono`)

### Backend & API Layer
- **Architecture:** Next.js App Router Route Handlers (`src/app/api/...`)
- **Authentication:** NextAuth.js v5 (`next-auth@5.0.0-beta.32`) with JWT session management, bcryptjs hashing, and multi-tenant organization tenancy (`DEMO_ORG_ID` mapping)
- **Payment & Processor Integration:** Official Stripe Node SDK (`stripe` v22.5.0)

### Data Persistence & Multi-Tenant Engine
- **ORM:** Drizzle ORM v0.45.2 + Drizzle Kit v0.31.10
- **Database Driver:** `pg` (Node Postgres v8.20.0)
- **Resilient Fallback Mode:** `src/db/index.ts` features a dual-mode persistence architecture:
  - If `DATABASE_URL` is active, queries execute against live PostgreSQL tables.
  - If PostgreSQL is offline or unconfigured, the platform seamlessly runs against a synchronized in-memory state engine initialized with comprehensive mock seed data (`seed-data.ts`).

---

## 3. Database Schema (`src/db/schema.ts`)

The relational model includes multi-tenancy, dispute tracking, evidence management, and immutable audit trails:

```
┌─────────────────┐       ┌─────────────────┐
│  organizations  │───┬──<│      users      │
└─────────────────┘   │   └─────────────────┘
         │            │
         │            ├──<│    integrations │
         │            │   └─────────────────┘
         │            │
         │            ├──<│   audit_logs    │
         │            │   └─────────────────┘
         │            │
         │            └──<│  notifications  │
         │                └─────────────────┘
         ▼
┌─────────────────┐       ┌─────────────────┐
│    customers    │<──────│     orders      │
└─────────────────┘       └─────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │    disputes     │
                          └─────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │    evidence     │
                          └─────────────────┘
```

### Table Definitions
1. **`organizations`**: Multi-tenant container (UUID, name, unique slug, JSONB settings).
2. **`users`**: RBAC system with roles: `ADMIN`, `MANAGER`, `OPERATOR`.
3. **`customers`**: End-customer profiles, addresses, and history.
4. **`orders`**: Transaction amounts, tracking info, delivery timestamps, and order payloads.
5. **`disputes`**: Central dispute record containing:
   - Dispute metadata: `amount`, `currency`, `reason`, `reasonCode`, `deadline`, `status` (`OPEN`, `EVIDENCE_COLLECTING`, `PENDING_APPROVAL`, `SUBMITTED`, `WON`, `LOST`, `EXPIRED`).
   - Intelligence fields: `winProbability`, `evidenceStrengthScore`, `aiAnalysis` (JSONB report), `rebuttalLetter`, `rebuttalTone`.
   - Human-in-the-Loop fields: `approvedByUserId`, `approvedByUserName`, `approvalNotes`, `approvedAt`, `submittedAt`.
6. **`evidence`**: Granular evidence records linked to disputes:
   - Types: `ORDER_DETAILS`, `SHIPPING_PROOF`, `CUSTOMER_COMMUNICATION`, `TOS_AGREEMENT`, `OTHER`.
   - Attributes: `confidenceScore`, `isAutoCollected`, `isIncludedInSubmission`, `sourceIntegration`, `fileUrl`.
7. **`audit_logs`**: Immutable security log of all user and system actions with IP address and timestamps.
8. **`integrations`**: Configuration and credentials for Stripe, Shopify, EasyPost, etc.
9. **`notifications`**: In-app alert system with severity ratings and action links.

---

## 4. AI & Automation Pipeline

The platform uses a tiered orchestration approach:

### Tier 1: RocketRide Pipeline (`rocketride/chargeback_defender.pipe`)
Defined as a 6-stage DAG:
1. **`ingress_webhook`**: Captures processor webhooks (`charge.dispute.created`).
2. **`gather_evidence`**: Extracts facts from connected sources (Shopify, Gateways, EasyPost signatures, Zendesk chats).
3. **`evaluate_case`**: Runs specialized agent evaluating evidence against network guidelines (Visa Compelling Evidence 3.0).
4. **`format_payload`**: Formats output to target dispute API schema.
5. **`enforce_guardrails`**: Enforces human signoff (`human_signoff_required: true`, auto-submits if score > 95%).
6. **`persist_outcome`**: Feeds outcomes back into persistent memory for continuous calibration.

### Tier 2: Google Gemini & Heuristic Fallback (`src/lib/ai/`)
- **LLM Integration:** Direct integration with Google's Gemini SDK (`@google/genai`) in `src/lib/gemini.ts`.
- **Heuristic Engine (`src/lib/scoring.ts`):** Calculates win probability and evidence completeness using weighted credit card rule factors (AVS match, delivery proof, customer tenure, dispute frequency).
- **Client Wrapper (`src/lib/rocketride/client.ts`):** Transparently dispatches to the RocketRide engine when configured, or executes local Gemini analysis without interrupting workflows.

---

## 5. User Interface & Page Workflows

### Public & Marketing
- **Landing Page (`src/app/landing`):** Interactive problem showcase, ROI calculator comparing recovery gains against dispute fees, and live feature demonstrations.
- **Authentication (`src/app/login`):** Credentials login with demo access.

### Operational Dashboard (`src/app/(dashboard)`)
- **Executive Overview (`/`):** KPI cards (Win Rate %, Total Recovered, Active Disputes, Attention Required), visual dispute pipelines, and deadline heatmaps.
- **Dispute Command Center (`/disputes`):** Search, status filtering, reason code breakdown, win probability ranking, and batch triage.
- **Dispute Deep-Dive (`/disputes/[id]`):**
  - Interactive Evidence Matrix (toggle evidence inclusions, preview carrier signatures).
  - AI Rebuttal Generator (customizable tone: firm, conciliatory, factual).
  - One-click PDF evidence packet compilation.
  - Human sign-off and direct submission to Stripe/processors.
- **Analytics & Reporting (`/analytics`, `/reports`):** Reason code breakdown, processor win rate comparisons, historical recovery analytics.
- **Integrations Hub (`/integrations`):** Connectors for Stripe, Shopify, WooCommerce, EasyPost, and customer service platforms.
- **Audit Logs (`/audit-logs`):** Compliance-ready event log.
- **Team & Settings (`/team`, `/settings`):** Role administration and dispute threshold automation parameters.

---

## 6. API Surface Map

| Route | Methods | Purpose |
| :--- | :--- | :--- |
| `/api/disputes` | `GET`, `POST` | List filtered disputes or ingest new dispute records |
| `/api/disputes/[id]` | `GET`, `PATCH`, `DELETE` | Fetch, update, or cancel specific dispute |
| `/api/disputes/[id]/analyze` | `POST` | Trigger RocketRide / Gemini AI analysis & draft rebuttal |
| `/api/disputes/[id]/submit` | `POST` | Finalize human review and submit evidence to processor |
| `/api/analytics` | `GET` | Calculate recovery metrics, win rates, and trends |
| `/api/audit-logs` | `GET` | Fetch system and operator action history |
| `/api/integrations` | `GET`, `POST`, `PATCH` | Manage API keys and webhook connections |
| `/api/notifications` | `GET`, `PATCH` | Fetch and mark operator alerts as read |
| `/api/processor` | `POST` | Direct processor action dispatcher |
| `/api/webhooks/stripe` | `POST` | Receive live Stripe dispute webhooks |
| `/api/health` | `GET` | Health check probe for database and runtime status |

---

## 7. Blueprint Alignment & Roadmap Opportunities

| Architectural Layer | Target Specification | Current Implementation | Action for Enterprise Scale |
| :--- | :--- | :--- | :--- |
| **Process Separation** | Microservices (Go, NestJS, Python) | Single Next.js Monolith | Extract high-throughput webhook gateway and Python ML inference into isolated containers if scale requires. |
| **Workflow Engine** | Temporal (Durable execution) | Next.js Route Handlers | Introduce Temporal workers for long-running 30-90 day dispute outcome polling. |
| **Messaging** | Apache Kafka (Event Streaming) | In-process API invocation | Add Kafka or RabbitMQ event producers for high-volume ingest spikes. |
| **Analytics Engine** | ClickHouse Time-Series | PostgreSQL Aggregations | Migrate high-volume audit logs and events to ClickHouse when dispute volume exceeds millions/month. |
