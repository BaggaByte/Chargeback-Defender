# CHARGEBACK DEFENDER — FINAL PRODUCTION MVP IMPLEMENTATION

You are the primary senior software engineer responsible for taking the existing Chargeback Defender repository from its current working MVP state to a polished, production-ready MVP.

This is an EXISTING CODEBASE.

Do NOT rebuild the application from scratch.

Do NOT assume the architecture described in `BLUEPRINT.md` is already implemented.

Your first responsibility is to understand the actual repository.

---

# 1. PRODUCT GOAL

Chargeback Defender is an AI-powered chargeback/dispute intelligence platform.

The core product loop is:

```text
Stripe Dispute
      ↓
Dispute Ingestion
      ↓
Dispute Normalization
      ↓
Evidence Collection
      ↓
AI Analysis
      ↓
Evidence Strength + Win Probability
      ↓
Missing Evidence Detection
      ↓
AI Draft Response
      ↓
AI Verification
      ↓
Human Review
      ↓
Approval
      ↓
Evidence Submission
      ↓
Resolution Tracking
```

The AI must remain advisory.

A human must remain responsible for final approval/submission.

---

# 2. CURRENT TECHNOLOGY DIRECTION

The repository currently uses a pragmatic Next.js monolith.

Expected existing technologies include:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- PostgreSQL
- Drizzle ORM
- NextAuth.js
- Stripe SDK
- Gemini via `@google/genai`
- existing dashboard
- existing dispute APIs
- existing AI implementation
- existing Stripe/integration routes
- existing audit logs
- existing analytics

Preserve working functionality.

---

# 3. IMPORTANT ARCHITECTURE DECISION

For the current MVP:

KEEP:

```text
Browser
   ↓
Next.js
   ├── UI
   ├── API
   ├── Authentication
   ├── Stripe integration
   ├── AI integration
   ├── business logic
   └── Drizzle
          ↓
      PostgreSQL
```

Do NOT force the following into the current MVP:

- Go gateway
- NestJS microservices
- Python AI microservice
- Kafka
- Temporal
- ClickHouse
- Kubernetes
- separate billing microservice

These may be future architecture.

Do not create unnecessary infrastructure simply because it appears in `BLUEPRINT.md`.

---

# 4. ROCKETRIDE IS REQUIRED

RocketRide should be a REAL part of the product.

Do not add RocketRide merely as a trivial API call.

Use RocketRide as the AI pipeline/execution layer for the dispute intelligence workflow.

The AI architecture should conceptually become:

```text
                AI Layer
                   │
        ┌──────────┴──────────┐
        │                     │
     Gemini              RocketRide
                              │
                       AI Pipelines
                              │
             ┌────────────────┼────────────────┐
             │                │                │
        Evidence          Dispute          Response
        Analysis          Analysis         Generation
             │                │                │
             └────────────────┼────────────────┘
                              │
                         Verification
```

Gemini must NOT simply be deleted.

Create a provider abstraction so the application can use RocketRide or Gemini without changing business logic.

---

# 5. FIRST ACTION — FULL REPOSITORY AUDIT

Before making substantial changes, inspect the repository.

At minimum inspect:

- `package.json`
- lockfile
- `BLUEPRINT.md`
- source tree
- `src/app`
- `src/components`
- `src/lib`
- `src/db`
- Drizzle configuration
- database schema
- seed data
- authentication
- middleware
- Stripe integration
- Stripe webhook implementation
- dispute APIs
- AI implementation
- analytics
- audit logs
- environment files/examples
- tests
- deployment configuration
- existing RocketRide integration/configuration

Search for:

```text
process.env
Stripe
webhook
dispute
evidence
AI
Gemini
RocketRide
audit
auth
session
role
DATABASE_URL
```

Do not start coding until you understand what already exists.

---

# 6. CREATE IMPLEMENTATION STATUS

Create or update:

`IMPLEMENTATION_STATUS.md`

Track:

- current architecture
- completed work
- remaining work
- known technical debt
- environment requirements
- validation status
- deployment blockers

Update this file as implementation progresses.

Do not create duplicate documentation files unnecessarily.

---

# 7. AI PROVIDER ABSTRACTION

Create a clean server-side AI abstraction.

Conceptually:

```ts
interface DisputeAIProvider {
  analyzeDispute(input: DisputeAIInput): Promise<DisputeAIResult>
}
```

Implement:

```text
GeminiProvider
RocketRideProvider
```

The application should call the abstraction rather than directly depending on RocketRide/Gemini throughout the codebase.

Use configuration such as:

```env
AI_PROVIDER=rocketride
```

and, only if genuinely useful:

```env
AI_FALLBACK_PROVIDER=gemini
```

Do not invent unsupported RocketRide SDK methods.

Inspect the installed RocketRide package and/or official API documentation available to you before implementing it.

---

# 8. ROCKETRIDE PIPELINE

Implement a meaningful RocketRide pipeline.

Conceptually:

```text
Dispute Input
      ↓
Validate
      ↓
Normalize
      ↓
Evidence Analysis
      ↓
Dispute Reason Analysis
      ↓
Evidence Strength
      ↓
Missing Evidence Detection
      ↓
Win Probability
      ↓
Response Generation
      ↓
Response Verification
      ↓
Structured Result
```

Use RocketRide's actual supported pipeline syntax/API.

Do not fabricate `.pipe` syntax or SDK APIs.

If the repository already contains RocketRide examples, follow those conventions.

---

# 9. STRUCTURED AI OUTPUT

AI output must be structured and validated.

Conceptually:

```json
{
  "summary": "...",
  "winProbability": 0.82,
  "confidence": 0.91,
  "evidenceStrength": "strong",
  "supportingEvidence": [],
  "missingEvidence": [],
  "riskFlags": [],
  "recommendedActions": [],
  "draftResponse": "...",
  "verification": {
    "passed": true,
    "unsupportedClaims": [],
    "contradictions": []
  }
}
```

Adapt this to the existing database/schema.

Do not duplicate existing fields/tables unnecessarily.

Validate AI output server-side.

Malformed AI output must never silently enter the database as trusted data.

---

# 10. HALLUCINATION PROTECTION

This is a core product requirement.

The AI must never invent:

- transaction dates
- delivery confirmation
- customer statements
- IP addresses
- authentication events
- refund information
- product usage
- policy acceptance
- shipping information

If evidence does not exist, it must be represented as missing.

The response generator must only use facts supplied by the system.

---

# 11. EVIDENCE ENGINE

Build a reusable evidence-analysis layer around existing database data.

Possible evidence:

- transaction information
- payment information
- customer information
- order information
- delivery information
- refund information
- customer communications
- authentication/3DS
- subscription records
- cancellation records

First inspect what the current database actually contains.

Do not create fake evidence tables simply to satisfy the architecture.

Reuse existing data models wherever possible.

The evidence engine should identify:

```text
Evidence
├── type
├── relevance
├── strength
├── supporting facts
└── contradictions
```

---

# 12. DISPUTE STATE MACHINE

Normalize the existing dispute lifecycle.

Use existing states when possible.

Conceptually:

```text
RECEIVED
   ↓
PROCESSING
   ↓
EVIDENCE_READY
   ↓
AI_ANALYZED
   ↓
NEEDS_REVIEW
   ↓
APPROVED / REJECTED
   ↓
SUBMITTED
   ↓
RESOLVED / FAILED
```

Do not allow arbitrary client-side status changes.

Implement explicit server-side transitions.

Important transitions must create audit records.

---

# 13. STRIPE WEBHOOKS

Inspect the existing Stripe webhook implementation first.

If it already works:

HARDEN IT.

Do not create a second competing webhook.

Ensure:

- Stripe signature verification
- idempotent event handling
- duplicate event protection
- correct dispute creation/update
- safe error handling
- auditability

Stripe event IDs should be treated as idempotency keys where appropriate.

Never trust arbitrary client-provided Stripe event data.

---

# 14. HUMAN REVIEW

The AI must NOT automatically approve or submit disputes.

Create/normalize the review flow:

```text
AI Result
    ↓
Human Review
    ├── Approve
    ├── Reject
    └── Request Changes
```

The reviewer should be able to see:

- dispute information
- evidence
- AI reasoning summary
- win probability
- confidence
- missing evidence
- risk flags
- generated response
- verification result

Keep the existing UI design.

Do not perform a massive redesign unless necessary.

---

# 15. AUDIT LOGGING

Important actions should be auditable.

Record:

- dispute
- previous state
- new state
- actor
- action/source
- timestamp
- relevant metadata

Never log:

- API keys
- passwords
- authentication secrets
- unnecessary payment secrets
- raw provider credentials

---

# 16. SECURITY

Perform a security audit while implementing.

Check for:

- secrets committed to source
- `NEXT_PUBLIC_` misuse
- client-side exposure of provider keys
- missing authentication
- missing authorization
- IDOR vulnerabilities
- unsafe database queries
- unsafe input handling
- unrestricted API endpoints
- sensitive logging
- insecure webhook handling
- trusting AI output
- client-controlled dispute status
- privilege escalation

Fix issues you discover when they are directly related to this MVP.

Do not perform unrelated refactoring.

---

# 17. ENVIRONMENT VARIABLES

Maintain a clean `.env.example`.

Document only variables actually required by the implementation.

Potential variables may include:

```env
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
GEMINI_API_KEY=
ROCKETRIDE_APIKEY=
ROCKETRIDE_URI=
AI_PROVIDER=rocketride
```

Do not add variables that the application does not actually use.

Never expose server secrets through `NEXT_PUBLIC_*`.

---

# 18. DATABASE

Use the existing PostgreSQL + Drizzle architecture.

Do not migrate to Prisma.

Do not replace the existing schema blindly.

Before modifying the schema:

1. inspect current schema
2. identify reusable tables
3. identify missing fields
4. make the smallest safe migration

Ensure production migration strategy is documented.

Do not blindly execute destructive migrations.

---

# 19. ERROR HANDLING

The application must gracefully handle:

- RocketRide unavailable
- Gemini unavailable
- malformed AI response
- validation failure
- Stripe webhook failure
- database failure
- unauthorized access
- missing dispute
- duplicate event
- workflow failure

Errors shown to users should be safe and useful.

Detailed internal errors may be logged server-side without exposing secrets.

---

# 20. DEPLOYMENT

Prepare the application for realistic deployment.

Prefer:

```text
Next.js → Vercel
PostgreSQL → Neon/Supabase/Railway/etc.
Stripe → production webhook
RocketRide → server-side
```

Use the provider already chosen by the repository if one exists.

Do not add infrastructure just for the sake of architecture.

Do not automatically run destructive database migrations as part of every frontend build.

Document the safe production migration process.

---

# 21. TESTING

Add or improve tests where the existing project supports them.

At minimum validate:

### Authentication
Unauthorized users cannot access protected dispute data.

### Authorization
Users cannot access another user's/merchant's disputes.

### Stripe
Invalid webhook signatures are rejected.

### Idempotency
Duplicate Stripe events do not duplicate disputes.

### State machine
Invalid state transitions are rejected.

### AI
Malformed AI output is rejected.

### Hallucination protection
Unsupported facts are not accepted.

### RocketRide
Provider selection works.

### Failure handling
RocketRide failure does not corrupt dispute state.

### Human review
AI cannot directly approve/submit a dispute.

---

# 22. UI

Preserve the existing visual identity.

Do not replace the dashboard with a generic template.

Improve only what is needed to expose:

- dispute status
- AI analysis
- evidence strength
- win probability
- missing evidence
- risk flags
- AI draft
- verification
- review actions

The product should feel like a serious B2B security/fintech product.

Avoid:

- unnecessary gradients
- excessive animations
- "hacker" aesthetics
- fake metrics
- fake integrations

---

# 23. DEVELOPMENT STRATEGY

Work in controlled phases.

## Phase A — Audit

Inspect repository and create implementation plan.

Do not make large code changes yet.

## Phase B — Foundation

Fix environment/configuration/security/migration issues.

## Phase C — AI Architecture

Implement provider abstraction and RocketRide integration.

## Phase D — Dispute Intelligence

Implement evidence analysis, dispute analysis, missing evidence, scoring, and response generation.

## Phase E — Verification

Implement AI output verification and hallucination protection.

## Phase F — Workflow

Connect:

```text
Stripe
 ↓
Dispute
 ↓
Evidence
 ↓
RocketRide
 ↓
AI Result
 ↓
Human Review
```

## Phase G — Production Hardening

Security, error handling, logging, idempotency, deployment.

## Phase H — End-to-End Validation

Test the complete user journey.

---

# 24. IMPORTANT AGENT RULES

Follow these rules strictly.

### RULE 1
Inspect before modifying.

### RULE 2
Reuse existing working code.

### RULE 3
Do not rebuild existing functionality.

### RULE 4
Do not blindly follow `BLUEPRINT.md` when it conflicts with the actual repository.

### RULE 5
Do not introduce microservices unless there is a demonstrated requirement.

### RULE 6
Do not invent APIs, SDK methods, database tables, environment variables, or RocketRide syntax.

### RULE 7
Keep secrets server-side.

### RULE 8
Do not let AI directly perform irreversible actions.

### RULE 9
Prefer small, reviewable changes.

### RULE 10
After each major phase:

- run tests
- run lint
- run typecheck
- run production build where practical
- inspect the resulting diff
- update `IMPLEMENTATION_STATUS.md`

### RULE 11
If something fails because of the existing repository, distinguish:

```text
PRE-EXISTING
```

from:

```text
INTRODUCED BY THIS CHANGE
```

Do not hide failures.

### RULE 12
Do not stop merely because the code compiles.

Verify actual behavior.

---

# 25. FINAL ACCEPTANCE CRITERIA

The project is considered successful when this flow works:

```text
User logs in
      ↓
Stripe dispute exists
      ↓
Webhook safely ingests dispute
      ↓
Dispute appears in dashboard
      ↓
Evidence is gathered from available data
      ↓
RocketRide analyzes the dispute
      ↓
Evidence strength calculated
      ↓
Missing evidence identified
      ↓
Win probability generated
      ↓
Response drafted
      ↓
Response independently verified
      ↓
Human reviews result
      ↓
Human approves/rejects
      ↓
Action is audited
```

No fabricated evidence.

No secret exposure.

No arbitrary client-side state changes.

No duplicate Stripe events.

No unverified AI output being treated as truth.

---

# 26. FINAL REPORT

When implementation is complete, provide:

## Architecture
What the final architecture actually is.

## RocketRide
Exactly how RocketRide is being used.

## AI pipelines
List every implemented pipeline/stage.

## Database
Schema changes and migrations.

## APIs
New or modified endpoints.

## Files
Files created and modified.

## Dependencies
Packages added/removed.

## Environment
Required environment variables.

## Security
Security issues discovered and fixed.

## Testing
Tests executed and results.

## Build
Lint/typecheck/build results.

## Deployment
Exact remaining deployment requirements.

## Known limitations
Be honest.

## Next improvements
Only list genuinely useful future work.

Do not claim success for anything that was not actually tested.

---

# FINAL INSTRUCTION

Treat this repository as a real production codebase, not a greenfield demo.

The priority order is:

```text
Correctness
   ↓
Security
   ↓
Reliability
   ↓
Maintainability
   ↓
RocketRide integration
   ↓
User experience
   ↓
Future scalability
```

Do not optimize for architectural complexity.

Optimize for a working, demonstrable, production-quality Chargeback Defender MVP with RocketRide as a genuine AI pipeline layer.

Begin by inspecting the repository and `BLUEPRINT.md`.

Create the implementation plan.

Then execute the plan phase-by-phase, validating each phase before continuing.
