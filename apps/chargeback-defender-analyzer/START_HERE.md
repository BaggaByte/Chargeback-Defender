# What this is

Two deliverables, addressing the gaps found in BaggaByte/Chargeback-Defender:

```
pipelines/dispute-analyzer.pipe          # replaces rocketride/dispute-analyzer.pipe
apps/chargeback-defender-analyzer/       # new — the actual marketplace app
```

## 1. `pipelines/dispute-analyzer.pipe`

Rewritten as real RocketRide pipeline JSON (`components` first, literal
`project_id`, correct field order) instead of the YAML mockup that was in
the repo. It only uses providers I could confirm are real, by reading
`rocketride-server`'s own shipped example (`examples/rag-pipeline.pipe`)
and `ROCKETRIDE_COMPONENT_REFERENCE.md`:

`webhook` (source) → `parse` → `extract_data` (controlled by `llm_openai`) → `response_answers`

**This will load, but I could not verify it end-to-end** — that requires
your actual `.rocketride/services-catalog.json`, which only exists once
you've connected the VS Code extension to a server. Two things to check
once you have it:

- Confirm `extract_data`'s exact config shape in
  `.rocketride/schema/extract_data.json` — I inferred the `instructions`
  field from the `prompt` node's pattern; extract_data may expect a
  different shape (e.g. an explicit output schema).
- Confirm `llm_openai`'s `openai-4o` profile name still matches the
  catalog — profile names are server-defined and can differ by version.

The old file's `marketplace:` block (pricing, author, tags, license) is
gone — that metadata now lives correctly in the app's `package.json`
(below), which is where RocketRide actually reads it from.

## 2. `apps/chargeback-defender-analyzer/`

A real scaffold following `ROCKETRIDE_APPS.md` exactly: `AppDescriptor.ts`,
the Module Federation config, the async-boundary `index.ts`, the manifest
in `package.json`. It's a thin app — one form, one pipeline call — not a
port of your full dashboard.

**Before this runs, you must:**

1. Replace `REPLACE_WITH_YOUR_DEVELOPER_ID` in `package.json` and
   `src/AppDescriptor.ts` with your actual claimed RocketRide developer
   namespace (Deploy tab → register once, if you haven't).
2. Drop both folders into your RocketRide workspace root (`apps/` and
   `pipelines/` siblings), so the relative import path in `App.tsx`
   (`../../../pipelines/dispute-analyzer.pipe`) resolves.
3. **Do not `npm install`** — this workspace uses `pnpm`; `npm install`
   here can corrupt the workspace per RocketRide's own docs.
4. Open the `.rrapp` file to launch it in the App Builder, which will do
   the real `pnpm install` and start the dev server/watch.
5. Check the billing block — I set `interval: "per_use"` to match your
   original "$0.50/dispute" pricing intent, but I could not confirm
   RocketRide's Stripe-shaped `billing.plans` actually supports a
   per-use interval (vs. only subscription intervals with usage-based
   metadata). Verify on the Store tab before you rely on it.

**What I did not build:** the full dispute command-center as a RocketRide
app (evidence matrix, approval queue, Stripe submission). That's the
"Scope B" full port — a separate, larger project layering RocketRide UI
components over your existing Next.js API routes.
