# Deploying to Netlify

The site is deployable today. Card checkout is not, and won't be until a Lemon
Squeezy store exists — until then it refuses honestly rather than pretending
(see step 4).

## 1. Create the site

Netlify → Add new site → Import from Git → `eIIe11/function`. Everything else is
already in `netlify.toml`, so accept the detected settings:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |
| Node version | 20 |

The live site is [function11.netlify.app](https://function11.netlify.app/).

`npm run build` runs the content validator first. `netlify.toml` currently sets
`CONTENT_REQUIRE_REVIEW="false"`, so a build ships content that is still
`reviewed_by: null` — deliberate while the site is a preview, and paired with an
`X-Robots-Tag: noindex` header so unreviewed copy cannot reach a search index.
**Flip both before selling to the public:** set it to `"true"` (the build then
refuses unsigned-off content) and drop the noindex header. Malformed content,
banned phrases, bad competency weights and unreachable scenario nodes fail the
build either way.

## 2. Environment variables

Site configuration → Environment variables. Nothing here belongs in the repo.

Nothing is required for the site to build and run: an unset `PAYMENT_PROVIDER`
behaves as `invoice`, so checkout refuses honestly instead of crashing. Minimum
for a *useful* deploy without card payments:

```
PAYMENT_PROVIDER=invoice
SALES_EMAIL=<where seat enquiries should land>
RESEND_API_KEY=<from resend.com>
INVOICE_FROM_EMAIL=<a verified sender on your domain>
```

Without `RESEND_API_KEY` and `SALES_EMAIL` the corporate enquiry form returns a
503 telling the buyer to email instead — deliberate, so an enquiry is never
accepted into a void.

## 3. Custom domain

Domain management → Add a domain. Netlify provisions the certificate. It also
sets `URL` automatically, which is what `/api/checkout` uses to reject an
off-site `returnUrl`, so nothing needs configuring for that.

## 4. Turning card payments on

1. Create a Lemon Squeezy store and a product with two variants matching
   `yourself-full` (£149) and `yourself-starter` (£49).
2. Add the environment variables:

```
PAYMENT_PROVIDER=lemonsqueezy
LEMONSQUEEZY_API_KEY=<api key>
LEMONSQUEEZY_STORE_ID=<store id>
LEMONSQUEEZY_VARIANTS=yourself-full=<variant id>,yourself-starter=<variant id>
PAYMENT_WEBHOOK_SECRET=<the signing secret you set on the webhook>
```

3. In Lemon Squeezy, add a webhook to `https://<your-domain>/api/payment-webhook`
   for `order_created` and `order_refunded`.
4. Buy something in test mode. The webhook logs a normalised payment event; it
   does **not** yet grant access, because there is no database. Fulfilment is the
   next piece of work, so do not sell to the public until it exists — a payment
   taken now is reconcilable from the function log, but not automatic.

## 5. Deploy previews

Every PR gets a preview URL with the functions attached. `URL` is set to the
preview origin, so same-origin checks pass there too.

## What is deliberately not automated

No `netlify deploy` in CI. CI runs lint, typecheck, validate, tests and the
build; Netlify's own Git integration does the deploying, so there is one place
that deploys and one set of credentials, not two.
