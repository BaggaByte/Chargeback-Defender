# DEPLOYMENT.md — Chargeback Defender Production Runbook

---

## 1. Recommended Infrastructure

| Layer | Recommended Provider | Notes |
|-------|---------------------|-------|
| Next.js App | Vercel | Zero-config Next.js deployment |
| PostgreSQL | Neon / Supabase / Railway | Managed serverless-compatible Postgres |
| Stripe | Stripe Dashboard | Register production webhook |
| RocketRide | RocketRide Cloud | ROCKETRIDE_API_KEY from dashboard |
| Gemini | Google AI Studio | Optional fallback provider |

---

## 2. Environment Variables (Production)

Copy `.env.example` to `.env.local` (local dev) or configure via hosting provider's environment panel.

```bash
# Required in all environments
DATABASE_URL="postgresql://user:pass@host:5432/chargeback_defender?sslmode=require"
AUTH_SECRET="<output of: openssl rand -base64 33>"
AUTH_URL="https://your-production-domain.com"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AI Provider Configuration
AI_PROVIDER="rocketride"           # Primary: rocketride | gemini
AI_FALLBACK_PROVIDER="gemini"      # Fallback when primary unavailable
GEMINI_API_KEY="AIzaSy..."
ROCKETRIDE_API_KEY="sk_rr_live_..."
ROCKETRIDE_ENDPOINT="https://api.rocketride.ai:443"
```

---

## 3. Database Migration (SAFE PRODUCTION PROCESS)

> [!CAUTION]
> **Never run `db:push` in production.** Use `db:migrate` which applies safe sequential migrations only.

### Step-by-step
1. Provision a PostgreSQL database (Neon, Supabase, or Railway).
2. Set `DATABASE_URL` in your environment.
3. Run migrations:
   ```bash
   npm run db:migrate
   ```
4. Verify migration was applied:
   ```bash
   npm run db:studio
   ```
5. Optionally seed demo data:
   ```bash
   npx tsx seed.ts
   ```

### Rollback
- Migrations are additive. To roll back: drop added columns/tables manually or write a new migration.
- Never edit existing migration files after they have been applied to production.

---

## 4. Stripe Webhook Registration

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com/webhooks).
2. Click **Add endpoint**.
3. Set URL to: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `charge.dispute.created`
   - `charge.dispute.updated`
   - `charge.dispute.closed`
5. Copy the signing secret and set as `STRIPE_WEBHOOK_SECRET`.

---

## 5. Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Or connect the GitHub repository in the Vercel dashboard for automatic deployments.

**Build settings:**
- Framework: Next.js (auto-detected)
- Build command: `npm run build`
- Install command: `npm install`

---

## 6. Health Check

After deployment, verify:

```bash
curl https://your-domain.com/api/health
# Expected: {"status":"ok","db":"connected","timestamp":"..."}
```

---

## 7. Post-Deployment Checklist

- [ ] DATABASE_URL connected and migrations applied
- [ ] AUTH_SECRET set and stable (changing it invalidates all sessions)
- [ ] STRIPE_WEBHOOK_SECRET registered and verified
- [ ] Test Stripe webhook delivery via Stripe Dashboard → Webhooks → Send test event
- [ ] Verify dispute creation flow end-to-end with Stripe CLI:
  ```bash
  stripe trigger charge.dispute.created
  ```
- [ ] Verify AI analysis runs (check dispute AI analysis panel in dashboard)
- [ ] Verify human approval workflow operates correctly
- [ ] Confirm audit logs are recording state transitions
