# Environment variables

Two rules, both enforced by `npm run check:secrets`:

1. Only variables prefixed `VITE_` reach the browser. Everything else is available
   to serverless functions only.
2. No secret is ever read from `src/`. The client talks to `/api/*`; the function
   holds the key.

## Client (`VITE_`, public, inlined into the bundle)

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | later | Supabase project URL. Public by design. |
| `VITE_SUPABASE_ANON_KEY` | later | Anon key. Safe in the client **only** with RLS enabled on every table. |
| `VITE_POSTHOG_KEY` | optional | Product analytics. Absent means analytics is off, not broken. |
| `VITE_SENTRY_DSN` | optional | Browser error reporting. |
| `VITE_SITE_URL` | dev only | Convenience for local links. The functions derive their own origin from `URL` or the request. |

## Server only (never `VITE_`, never referenced in `src/`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | later | Bypasses RLS. Functions only. |
| `ANTHROPIC_API_KEY` | later | Open-response feedback. Server-side so prompts and the key stay private. |
| `RESEND_API_KEY` | later | Invoices, cohort invitations, check-in reminders. |
| `PAYMENT_PROVIDER` | yes | `lemonsqueezy` or `invoice`. Unset behaves as `invoice`: checkout refuses honestly. An id with no adapter throws at the first request rather than failing silently. |
| `PAYMENT_WEBHOOK_SECRET` | when payments are live | Verifies the provider webhook signature. An unverified webhook must throw, not be treated as a failed payment. |
| `LEMONSQUEEZY_API_KEY` + `LEMONSQUEEZY_STORE_ID` | if Lemon Squeezy | Checkout creation. |
| `LEMONSQUEEZY_VARIANTS` | if Lemon Squeezy | Plan → variant map, e.g. `yourself-full=123456,yourself-starter=123457`. In the environment because the ids differ between their test and live stores. |
| `SALES_EMAIL` | for corporate | Where seat-licence enquiries are delivered. |
| `PURCHASE_ORDER_LOG_ONLY` | dev only | `true` logs the enquiry and returns a reference instead of emailing. Never set this in production — it would silently swallow leads. |
| `URL` | set by Netlify | Site origin. Used to reject an off-site `returnUrl`, so checkout can't be used as an open redirect. |
| `INVOICE_FROM_EMAIL` | for corporate | `From` address on enquiry and invoice email. |

Paddle, Polar and Stripe have no adapter yet, so they have no variables. Adding
one is a single file in `netlify/lib/providers/` plus its entry in the registry.

## Payments

The provider is chosen at deploy time via `PAYMENT_PROVIDER` and the abstraction
is in `src/lib/payments/types.ts`. The client only ever receives a redirect URL
from `/api/checkout`; it never sees a key, a price object or a webhook payload.
The price comes from our own plan table, not the request body, so a tampered
request cannot buy the £149 plan for £1.

Corporate purchases do not require a payment provider at all:
`/api/purchase-order` emails the enquiry to `SALES_EMAIL`, an invoice is raised by
hand, and seats activate when the transfer clears.

## Local setup

```bash
cp .env.example .env.local   # no secrets in here; real keys go in the Netlify UI
npm install
npm run dev
```

`npm run dev` serves `netlify/functions/*` at `/api/*` through a small Vite
plugin, so the membership flow behaves locally the way it does deployed. With the
example env that means: individual checkout returns 503 with the honest message,
and the corporate enquiry logs to the terminal instead of emailing.
