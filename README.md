# FUNCTION.

A capability platform for people who are clever and were never taught how work
actually works — and for the employers who hired them and can't articulate what's
missing.

Two sides, one engine:

- **FUNCTION. Workplace** — seats, cohorts, capability reporting, certification.
- **FUNCTION. Yourself** — buy once, get a profile, get better.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:5173, with /api/* served from netlify/functions
```

## Verify it

```bash
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run validate     # copy lint + content schema + secret scan
npm run test         # vitest
npm run build        # validate, typecheck, then vite build
```

`npm run validate` is the interesting one. It refuses to build content that is
malformed, that scores a competency it shouldn't, that has an unreachable scenario
node, or that uses one of the banned phrases in
[`scripts/lint-copy.mjs`](scripts/lint-copy.mjs). Set
`CONTENT_REQUIRE_REVIEW=true` and it also refuses anything still
`reviewed_by: null`.

## How it's arranged

```
src/
  content/        Authored content + the Zod schema that is the only definition of valid
    schema.ts     Copy registers, weighted competencies, item types, scenario graphs
    intake/       12 forced-choice pairs, default setting, 12-item Baseline, 16 types
    units/        One directory per unit, one file per section
  components/
    activities/   The interaction library: MCQ, hot takes, triage, sequence, subtext,
                  open response, commitment, and the branching simulator
    layout/       AppShell (QUIET, mobile-first) and MarketingLayout (LOUD)
    brand/        Wordmark and the ampersand device
  lib/
    scoring.ts    Continuous quality → recency-weighted competency scores → XP → levels
    intake.ts     Forced choices → four-letter type code
    payments/     Provider-agnostic checkout. No provider is hard-wired
    sound.ts      Six synthesised UI cues. Muted until you tap something
  routes/         Fork, marketing, membership, intake, learn loop, tracker, profile
netlify/
  functions/      /api/checkout, /api/purchase-order, /api/payment-webhook
  lib/providers/  One file per payment processor. Keys never leave this directory
scripts/          Font fetch, brand asset generation, content validation, secret scan
docs/             ENV.md, DEPLOY.md, OPEN-DECISIONS.md
```

## Design rules that are not negotiable

- **Two registers, always.** Every string is `{ spicy, boardroom }` — the type
  makes a missing register a compile error, not a review comment.
- **Quality is continuous.** Options carry a 0–1 quality and a consequence. There
  is no "correct answer" boolean anywhere in the schema.
- **Capacity is never scored and never employer-visible.** Not in the model, not
  in the dashboard, not in the export.
- **No leaderboard, no infinite streak.** The tracker runs 30 days and stops.
- **Mobile-first and one-thumbed.** 375px is the design target; 44px is the
  minimum control; every drag or swipe has a keyboard equivalent.
- **LOUD outside, QUIET inside.** Marketing shouts. The learning surface never
  does — nobody wants a poster while they're being told they're wrong.

## Deploying

[docs/DEPLOY.md](docs/DEPLOY.md) is the runbook. Short version: Netlify picks up
`netlify.toml` and needs no build configuration, the site works without any
payment provider, and card checkout switches on with four environment variables
once a Lemon Squeezy store exists.

See [docs/OPEN-DECISIONS.md](docs/OPEN-DECISIONS.md) for what is deliberately
still undecided.
