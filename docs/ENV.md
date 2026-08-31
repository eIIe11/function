# Environment variables

Two rules, both enforced by `npm run check:secrets`:

1. Only variables prefixed `VITE_` reach the browser. Everything else is available
   to serverless functions only.
2. No secret is ever read from `src/`. The client talks to `/api/*`; the function
   holds the key.

## Client (`VITE_`, public, inlined into the bundle)

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SITE_URL` | yes | Absolute origin, used to build checkout return URLs. |
| `VITE_SUPABASE_URL` | later | Supabase project URL. Public by design. |
| `VITE_SUPABASE_ANON_KEY` | later | Anon key. Safe in the client **only** with RLS enabled on every table. |
| `VITE_POSTHOG_KEY` | optional | Product analytics. Absent means analytics is off, not broken. |
| `VITE_SENTRY_DSN` | optional | Browser error reporting. |
| `VITE_PAYMENT_PROVIDER` | yes | `lemonsqueezy` \| `paddle` \| `polar` \| `stripe` \| `invoice`. Chooses copy and the button label only — never a key. |

## Server only (never `VITE_`, never referenced in `src/`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | later | Bypasses RLS. Functions only. |
| `ANTHROPIC_API_KEY` | later | Open-response feedback. Server-side so prompts and the key stay private. |
| `RESEND_API_KEY` | later | Invoices, cohort invitations, check-in reminders. |
| `PAYMENT_WEBHOOK_SECRET` | when payments are live | Verifies the provider webhook signature. An unverified webhook must throw, not be treated as a failed payment. |
| `LEMONSQUEEZY_API_KEY` + `LEMONSQUEEZY_STORE_ID` | if Lemon Squeezy | Checkout creation. |
| `PADDLE_API_KEY` + `PADDLE_WEBHOOK_SECRET` | if Paddle | Checkout creation. |
| `POLAR_ACCESS_TOKEN` | if Polar | Checkout creation. |
| `STRIPE_SECRET_KEY` | if Stripe | Optional fallback. Note Stripe is **not** merchant of record, so VAT is yours. |
| `INVOICE_FROM_EMAIL`, `INVOICE_BANK_DETAILS` | for corporate | Rendered into the PDF invoice for bank transfer. |

## Payments

The provider is chosen at deploy time and the abstraction is in
`src/lib/payments/types.ts`. The client only ever receives a redirect URL from
`/api/checkout`; it never sees a key, a price object or a webhook payload.

Corporate purchases do not require a payment provider at all: `/api/purchase-order`
records the request, raises a PDF invoice, and seats activate when the transfer
clears.

## Local setup

```bash
cp .env.example .env.local   # VITE_ vars only; server keys belong in the host
npm install
npm run fetch:fonts
npm run dev
```
