# Payment Module — Reusable Guide (Bangla)

Ei guide ta future projects e payment system reuse korte sahaj korbe. Site-specific decision gulo explain kora hoise, r sathe generic, portable patterns/steps deya hoise.

## Purpose & Scope
- Goal: Stripe Connect-based escrow payment, platform fee, secure webhook, role-based access.
- Reuse: Same module onno project e use korte parben config change diye.

## Core Principles
- Escrow + Stripe Connect: Funds “held” → release/payout.
- Separation of concerns: Routes → Controllers → Services → Models.
- Idempotency: Webhook/event processing duplicate-safe (use `event.id` / local locks).
- Security: JWT auth, role-based access, rate-limit, raw body for webhooks.
- Observability: Logs, metrics; error handling without sensitive data leak.

## Config & Env Matrix
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PLATFORM_FEE_PERCENTAGE`, `MINIMUM_PAYMENT_AMOUNT`, `MAXIMUM_PAYMENT_AMOUNT`
- `FRONTEND_URL` — onboarding link `return_url`/`refresh_url`
- API prefix/mount: e.g. `API_PREFIX=/api/v1`, mount `payments` → full path `/api/v1/payments`
- Currency default: `usd` (expandable)

## Public API Contracts (Prefix: `/api/v1/payments` — customizeable)
- `POST /webhook` — Stripe webhook (raw body, no auth)
- `POST /stripe/account` — Create freelancer Stripe Express account (auth)
- `GET /stripe/onboarding` — Generate onboarding link (auth)
- `GET /stripe/onboarding-status` — Check charges/payouts (auth)
- `GET /history` — Payment history (auth)
- `GET /by-bid/:bidId/current-intent` — Current PaymentIntent + `client_secret` (auth)
- `POST /refund/:paymentId` — Initiate refund (auth)

Shape highlights:
- PaymentIntent create → return `clientSecret`
- Local payment model status: `pending` → `held` → `released/refunded/failed`

## Escrow — Why & How (Deep Details)
- Purpose: Trust & safety; platform controls fund release; disputes/chargebacks handle korte sahaj.
- Stripe mechanism: Manual capture intent → webhook `amount_capturable_updated` e capture → funds platform balance e “held”; release e `transfers.create` diye connected account e freelancerAmount.
- Pattern used: Separate Charges & Transfers — fee keep korar simplest path; refund straight against original intent; audit-friendly.
- Alternatives: Destination Charges — intent e `transfer_data.destination` + `application_fee_amount`; trade-offs ache (release timing/partial flows).

## Lifecycle & Flows
- Onboarding: account create → onboarding link → status check (`chargesEnabled`, `payoutsEnabled`)
- Escrow Payment: intent create (`capture_method: 'manual'`, metadata) → frontend confirm → webhook `amount_capturable_updated` e capture → local status `HELD`
- Release: `stripe.transfers.create` to freelancer account (optional `source_transaction` set) → status `RELEASED`
- Refund: `stripe.refunds.create({ payment_intent })` → status `REFUNDED`

## Stripe Connect Pattern Selection — Decision Guide
- Separate Charges & Transfers (recommended for escrow):
  - Pros: granular release control, simple fee keep, clear refunds, flexible partial release
  - Cons: extra transfer call, charge trace required
- Destination Charges (alternative):
  - Pros: one-shot charge with destination & fee
  - Cons: release tied to capture, partial/refund complexity, different reconciliation
- Migration checklist:
  - Update intent create to set `transfer_data.destination` & `application_fee_amount`
  - Adjust webhook/status mapping; remove manual transfer if auto handled
  - Revisit refund logic & fee accounting

## Idempotency & Reliability (Recommendations)
- Store processed `event.id` from webhook in DB; skip repeats
- Use idempotency keys for `paymentIntents.create`, `paymentIntents.capture`, `transfers.create`, `refunds.create`
- Atomic updates on DB models (`PaymentModel.update*`)
- Robust charge discovery: expand `latest_charge`, fallback `charges.list` by `payment_intent`
- Log and persist `stripeTransferId` for reconciliation

## Webhook Operations
- Raw body: app-level middleware only for webhook path
- Signature verify: `constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `amount_capturable_updated`, `account.updated`, `transfer.created/updated`, `payout.created/failed`
- Idempotency best practice:
  - Store processed `event.id` in DB; skip repeats
  - Use Atomic updates on Payment/Account records
  - Consider retry-safe handlers; avoid duplicate side effects

## Porting Checklist (New Project)
1) Install deps: `stripe`, `mongoose`, `express` (+ JWT/auth)
2) Copy module folders: routes/controllers/services/models/interfaces
3) Set API prefix & mount path in router (e.g. `/api/v1/payments`)
4) Add raw body middleware only for webhook route
5) Configure envs (`STRIPE_*`, fee/limits, `FRONTEND_URL`)
6) Wire auth roles (TASKER/POSTER) to your role system
7) Ensure DB indexes on payment/bid/task relations
8) Test with Stripe CLI (see below)

## Testing Recipes
- Stripe CLI: `stripe listen --forward-to http://localhost:<PORT>/api/v1/payments/webhook`
- Triggers: `stripe trigger payment_intent.succeeded` / `payment_intent.payment_failed` / `account.updated`
- Generate test signature header (Node) to validate verifier
- Integration tests: mock users, create intent, confirm via webhook trigger, assert status `HELD`

## Extensions & Options
- Multi-currency: add currency enum + conversion strategy
- Partial release: support `releaseAmount` with remaining held funds
- Auto-release: scheduled job after hold period
- Disputes: react to `charge.dispute.created` → freeze logic
- Alternative processors: keep service interfaces stable; add adapter layer

## FAQ & Gotchas

### Webhook Endpoint Duplicate/Mode Mismatch — How to Resolve
- Symptom: `Signature invalid` / webhook reject; local payment state update hoy na.
- Cause: Multiple endpoints (e.g., `nayem5001` & `nayem5000`) or wrong mode (Test secret + Live events).
- Steps:
  1) ONE endpoint choose korun (production domain preferable) → tar “Signing secret” copy korun.
  2) `.env` → `STRIPE_WEBHOOK_SECRET` update kore server restart korun.
  3) Extra endpoints disable/delete korun, na hole confusion e abar mismatch hote pare.
  4) Mode consistency confirm korun: Test keys + Test endpoint → test payments; Live keys + Live endpoint → live payments.
  5) Verify: Dashboard e “Recent deliveries”/“Send test webhook” ba `stripe trigger` diye check korun.

- Rules:
  - Webhook path e raw body thakbe; JSON parser apply korben na.
  - Ek server e duita alada secret maintain korben na; ekta consistent source thakbe.
  - CLI testing korle temporary `whsec_*` use hoy; production e eta deploy korben na.

- Quick Checklist (Porting):
  - [ ] Endpoint URL: `https://<domain>/api/v1/payments/webhook`
  - [ ] Correct mode (Test/Live) match
  - [ ] “Signing secret” `.env` e set
  - [ ] Duplicate endpoints off
  - [ ] Logs: “Stripe webhook verified” + event handler hit
- Signature invalid → JSON parser applied? Use raw body on webhook path only
- No `bid_id` in metadata → webhook can’t map payment → ensure metadata set at Intent create
- Charges disabled → onboarding incomplete; block payment creation
- Transfer fails → payouts disabled or negative balance; check account capabilities
- Rounding issues → use integers (cents) in Stripe; convert carefully

## References (This Repo)
- Deep Dive: `doc/payment-module-deep-dive-bn.md`
- Webhook: `doc/stripe-webhook.md`
- Module: `src/app/modules/payment/*`
- Config: `src/config/stripe.ts`, app middleware: `src/app.ts`