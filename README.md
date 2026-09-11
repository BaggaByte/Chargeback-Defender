# Chargeback Defender — Production MVP (v1)

Automated chargeback defense platform built as a high-performance, single-deploy Next.js monolith. Ingests dispute events from payment processors, gathers evidence, performs AI analysis with card network compliance heuristics, generates professional legal rebuttal letters, and supports human-in-the-loop review and submission.

---

## 1. Actual v1 Production Architecture

```
Browser (User / Merchant Operator)
       │
       ▼
Next.js 16 Application (App Router & Server Components)
├── UI & Dashboard (/disputes, /analytics, /audit-logs, /integrations)
├── API Routes & Webhook Receivers (/api/webhooks/stripe, /api/disputes/...)
├── Authentication (NextAuth.js v5 JWT Sessions + Role-based RBAC)
├── Stripe Integration (Official Node SDK, Raw Webhook Signature Verification)
├── AI Engine (Google Gemini 3.7/2.5 via @google/genai + Card Network Heuristics)
└── Drizzle ORM Data Layer (Type-safe SQL query builder)
       │
       ▼
PostgreSQL Database (Multi-tenant schema, persistent storage)
```

> **Note on Architecture:** The distributed microservice architecture (Go Gateway, Temporal workers, Python FastAPI, Apache Kafka, ClickHouse) outlined in `BLUEPRINT.md` is designated for future enterprise scale. For v1, the platform operates as a cohesive, production-ready Next.js monolith.

---

## 2. Core Product Loop

```
1. Stripe Dispute Event
   └─ Processor sends `charge.dispute.created` webhook

2. Webhook Verification
   └─ Raw request body validated with cryptographic signature (`STRIPE_WEBHOOK_SECRET`)

3. Database Persistence
   └─ Record stored idempotently in PostgreSQL via Drizzle ORM (`disputes`, `orders`, `customers`)

4. Automated Evidence Gathering
   └─ Ingests order details, tracking/carrier status, and customer communications

5. AI Analysis & Scoring
   └─ Evaluates evidence against Visa CE 3.0 & Mastercard CE 2.0 rules, calculates win probability

6. Rebuttal Drafting
   └─ Generates formal representment letter formatted for the acquiring bank with selectable tone

7. Human-in-the-Loop Review
   └─ Operator audits evidence matrix, edits letter if needed, and clicks "Approve & Submit"

8. Processor Submission & Status Tracking
   └─ Submits formatted evidence payload to Stripe API and tracks dispute lifecycle to resolution
```

---

## 3. Getting Started & Development

### Prerequisites
- Node.js >= 20.x
- PostgreSQL instance (or run with zero-config in-memory mock fallback mode for local testing)

### Installation
```bash
npm install
```

### Environment Setup
Copy the template configuration and fill in the required keys:
```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | 32+ character random secret for JWT encryption |
| `AUTH_URL` | Yes | Canonical base URL (`http://localhost:4000` for local dev) |
| `STRIPE_SECRET_KEY` | Yes | Stripe Secret Key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe Webhook Secret for signature validation |
| `GEMINI_API_KEY` | Yes | Google AI Studio API Key for dispute analysis |

---

## 4. Database Migrations & Scripts

All database schemas are managed through Drizzle ORM with migrations stored in `./drizzle`.

```bash
# Run local development server (port 4000)
npm run dev

# Generate new reproducible SQL migrations from schema
npm run db:generate

# Apply pending SQL migrations to PostgreSQL
npm run db:migrate

# Push schema directly to database (rapid prototyping)
npm run db:push

# Open visual database browser
npm run db:studio

# Run static type-checking
npm run typecheck

# Run ESLint validation
npm run lint

# Build production bundle
npm run build
```

---

## 5. Stripe Test Mode Demo

Follow these instructions to verify real-time, end-to-end ingestion and AI evidence generation locally using Stripe CLI.

### Local Development Flow

1. **Start the application locally**:
   ```bash
   npm run dev
   ```
2. **Authenticate with Stripe CLI**:
   ```bash
   stripe login
   ```
3. **Listen and forward webhooks**:
   ```bash
   stripe listen --forward-to localhost:4000/api/webhooks/stripe
   ```
   *Note: Copy the webhook signing secret (`whsec_...`) printed in the console and place it in your `.env.local` under `STRIPE_WEBHOOK_SECRET`.*
4. **Trigger a test dispute** (in a new terminal):
   ```bash
   stripe trigger charge.dispute.created
   ```

**What to expect**:
- You should see logs indicating a `REAL Stripe test event received`.
- The system will inject `[DEMO DATA]` as synthetic evidence for Rocket Ride evaluators.
- Within 5-10 seconds, the Dispute Dashboard (`http://localhost:4000`) will automatically refresh and display the newly created dispute with a `Test/Demo` AI score.

### Staging / Production
When deployed, ensure you add the public endpoint URL to your Stripe Dashboard Webhooks settings and configure the corresponding `STRIPE_WEBHOOK_SECRET` environment variable for your deployment.

---

## 6. Security Principles

1. **Stripe Webhook Signature Verification:** Raw text payload is strictly verified using HMAC SHA-256 in production.
2. **Zero Client Secret Leakage:** No server secrets or database credentials use the `NEXT_PUBLIC_` prefix.
3. **Multi-Tenant Isolation:** Database records and queries are scoped by `organizationId`.
4. **Parameterized SQL:** All database operations utilize Drizzle ORM's parameterized query builder, preventing SQL injection vulnerabilities.
5. **Connection Pool Management:** PostgreSQL pool enforces connection limits (`DB_MAX_CONNECTIONS`) and connection timeouts to safely run in serverless/containerized environments.
