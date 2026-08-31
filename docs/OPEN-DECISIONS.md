# Open decisions

Things I have deliberately not decided for you. Each one has a working default so
the build is not blocked, and each default is cheap to change.

| # | Decision | Current default | What changes when you decide |
| --- | --- | --- | --- |
| 1 | Legal entity and privacy notice | No entity named anywhere; privacy copy describes behaviour, not law | A real privacy notice, DPA for B2B, and the entity in the footer |
| 2 | Units at launch | Unit 01 live, curriculum copy says "being written" | Marketing claims, pricing, and certification thresholds |
| 3 | Video budget and provider | No video. Every activity is interactive instead | Whether `micro_video` and `audio_case` ship at all |
| 4 | Voice and performance direction | Spicy is blunt-but-kind; boardroom is plain and unhedged | The whole content register; changing it later is a rewrite, not a config |
| 5 | Support-resource territory | UK only, in `src/content/support-resources.json`, flagged unverified | Every entry must be verified by a human before launch; other countries needed before selling abroad |
| 6 | B2B pricing model | Per-seat with volume bands, number withheld until quoted | `src/lib/payments/plans.ts` and the corporate page copy |
| 7 | Individual payment provider | ~~None wired~~ **Lemon Squeezy adapter built** (merchant of record, so VAT is theirs). Inactive until a store exists: `PAYMENT_PROVIDER` defaults to `invoice` and checkout refuses honestly | Creating the store and setting four env vars — see docs/DEPLOY.md step 4. Switching to Paddle or Polar is one new file in `netlify/lib/providers/` |
| 8 | Individual price points | £149 full, £49 starter | `src/lib/payments/plans.ts` only |
| 9 | Content review sign-off | Every item is `reviewed_by: null`; `CONTENT_REQUIRE_REVIEW=true` fails the build | Who signs off, and CI turning that flag on for production deploys |

## Things I decided, and why, in case you disagree

- **No leaderboard, no infinite streak.** Both increase short-term engagement and
  both punish exactly the learner this product claims to help. The tracker ends
  at 30 days on purpose.
- **Quality is continuous, not right/wrong.** Every option carries a 0–1 quality
  and a real consequence, because "defensible but weaker" is the actual texture of
  workplace judgement.
- **Capacity is never scored and never employer-visible.** It is not in the
  competency model, not in the dashboard, and the Troubleshoot escape hatch
  records nothing.
- **Corporate does not use card checkout.** Purchase order, invoice, bank
  transfer. It is how procurement buys and it avoids card fees on large deals.
- **A payment path that isn't configured fails loudly.** Checkout returns 503 with
  "nothing was charged", and the corporate form refuses rather than issuing a
  reference for an enquiry no inbox will receive. Silence is the one outcome worth
  engineering against.
- **Fulfilment is not built yet.** The webhook verifies and normalises the payment
  but grants nothing, because there is no database. Do not sell publicly until
  that exists.
