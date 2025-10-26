# Task Titans Payment Module — Deep Dive (Bangla Guide)

Note: Future reuse er jonno compact guide dekhte: `doc/payment-module-reuse-guide-bn.md`.

Ei guide ta tomar `src/app/modules/payment` module ta sob-dik theke bujhte sahaj korbe: ki ki ache, kibabe kaj kore, keno dorkar, r kon kon term er mane ki — examples & analogy shoho.

## Overview — Ki & Keno
- Problem: Client (Poster) & Freelancer er moddhe safe payment dorkar — trust issue thake.
- Solution: Stripe Connect-based escrow system. Client taka pay kore, taka “held” thake, kaj complete hole freelancer ke transfer/payout hoy.
- Benefits: Automatic platform fee, secure verification (webhooks), clear status, role-based access control.

Analogy: Bank er amanat locker mone koro. Client locker e taka rakhlo (escrow). Kaj sesh hole manager key diye freelancer ke taka dibe (transfer/payout). Jodi kaj fail hoy, locker theke taka client e ferot jay (refund).

## Architecture — Kothay ki ache
- Routes: `src/app/modules/payment/payment.routes.ts`
- Controllers: `payment.controller.ts`, `webhook.controller.ts`
- Services: `payment.service.ts`
- Models: `payment.model.ts`, `StripeAccountModel`
- Interfaces/Enums: `payment.interface.ts`
- Config: `src/config/stripe.ts`
- App-level middleware: `src/app.ts` — webhook path e raw body
- Mount path: `src/routes/index.ts` — Payment routes under `/payments` with API prefix `/api/v1`

## Key Endpoints (Base: `/api/v1/payments`)
- `POST /webhook` — Stripe webhook (no auth). Raw body + signature verify.
- `POST /stripe/account` — Freelancer er Stripe Express account create (auth: `TASKER`).
- `GET /stripe/onboarding` — Onboarding link pawar jonno (auth: `TASKER`, `SUPER_ADMIN`).
- `GET /stripe/onboarding-status` — Onboarding/charges/payouts status (auth: `TASKER`, `POSTER`, `SUPER_ADMIN`).
- `GET /history` — Payment history (auth: `POSTER`, `TASKER`, `SUPER_ADMIN`).
- `GET /by-bid/:bidId/current-intent` — Ei bid er current PaymentIntent & `client_secret` (auth: `POSTER`, `TASKER`, `SUPER_ADMIN`).
- `POST /refund/:paymentId` — Refund start (auth: `POSTER`, `SUPER_ADMIN`).
- `GET /:paymentId` — Single payment details (auth: `POSTER`, `TASKER`, `SUPER_ADMIN`).
- `GET /` — All payments (auth: `SUPER_ADMIN`).
- `GET /stats/overview` — Stats overview (auth: `SUPER_ADMIN`).
- `DELETE /account/:accountId` — Stripe account delete (auth: `SUPER_ADMIN`).

## Stripe Connect Onboarding — Keno & Kibabe
- Keno: Freelancer ke taka dite hole Stripe e proper KYC/AML verify hoye account active dorkar.
- Steps:
  1) `POST /stripe/account` — freelancer er jonno Stripe Express account create.
  2) `GET /stripe/onboarding` — onboarding link paw.
  3) Freelancer link e giye info submit kore.
  4) `GET /stripe/onboarding-status` — `chargesEnabled` & `payoutsEnabled` check; `onboardingCompleted` update.

## Escrow — Why & How (Deep Details)
- Keno dorkar: Trust, safety, dispute handling, compliance. Direct pay dile platform er control nai; escrow funds hold kore rakhe joto khon na kaj complete hoy.
- Eikhane Stripe er role: `PaymentIntent` manual capture diye authorize hoy, webhook `amount_capturable_updated` ashle backend capture kore — funds platform balance e “held”. Release somoy `transfers.create` diye freelancer er connected account e freelancerAmount pathano hoy; platform fee nijer kache thake (transfer na kore).
- Current pattern: “Separate Charges & Transfers”. Intent e `transfer_data`/`application_fee_amount` deya hoy na; tar bodole later transfer hoy. Ete fine-grained control, easy refunds, audit-friendly.
- Fee handling: `calculatePlatformFee()` diye fee compute hoy; release e `freelancerAmount` matro transfer hoy — fee platform e. Alternative: “Destination Charges” use korle intent e `transfer_data.destination` + `application_fee_amount` set korte hoy.
- Status mapping: `PENDING` (intent created) → `HELD` (capture complete, funds platform balance) → `RELEASED` (transfer done) / `REFUNDED` / `FAILED` / `CANCELLED`.

## Stripe Connect Pattern Choice — Rationale
- Separate Charges & Transfers (current):
  - Pros: Full control on release timing; platform fee keep logic simple; refunds straightforward against original intent; flexible partial release.
  - Cons: Ekta extra API call (`transfers.create`), chargeId trace kora lagte pare.
- Destination Charges:
  - Pros: Built-in fee and destination at intent; ek call e end-to-end charge.
  - Cons: Release timing ties to capture; partial release/refund complexity beshi; some reconciliations different.
- Migration tips: Jodi future e destination charges chai, `payment.service.ts` er intent create e `transfer_data.destination` + `application_fee_amount` add korte hobe, webhook/status logic adapt korte hobe.

## Payment Flow — Escrow Details
1) Poster bid accept kore → backend `PaymentIntent` create hoy `capture_method: 'manual'`, metadata set: `bid_id`, `poster_id`, `freelancer_id`, `task_title`.
2) Frontend `client_secret` diye card confirm kore (3DS hole prompt hoy).
3) Stripe webhook `payment_intent.amount_capturable_updated` ashle backend intent capture kore → local status `HELD`. (Kichu khetre `payment_intent.succeeded` o ashe; amra oitao `HELD` set kore sync rakhi.)
4) Kaj complete hole release: backend `stripe.transfers.create` kore `freelancerAmount` connected account e pathay; optional `source_transaction` chargeId set kore traceability barano hoy.
5) Pore Stripe auto-payout schedule onujayi bank e payout hoy (webhook e `payout.created`/`updated`).
6) Refund: jodi cancel hoy, backend `stripe.refunds.create({ payment_intent })` kore; local status `REFUNDED`, bid `cancelled`.
7) Idempotency: intent/transfer/refund er jonno idempotency keys use korar best-practice; webhook handler e processed `event.id` store kore duplicate skip kora uchit (future enhancement).

Statuses (`PAYMENT_STATUS`): `PENDING` → `HELD` → `RELEASED` / `REFUNDED` / `FAILED` / `CANCELLED`.

## Webhooks — Raw Body & Signature
- Endpoint: `POST /api/v1/payments/webhook`
- App middleware: `src/app.ts` — `express.raw({ type: 'application/json' })` only for webhook path; JSON parser skip kore.
- Verify: `webhook.controller.ts` — `stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)`
- Supported events:
  - `payment_intent.succeeded` — local payment `HELD` set.
  - `payment_intent.payment_failed` — fail/rollback logic.
  - `payment_intent.amount_capturable_updated` — manual capture → `HELD`.
  - `account.updated` — onboarding/capabilities sync.
  - `transfer.created`, `transfer.updated` — transfer logs/processing.
  - `payout.created`, `payout.failed` — payout logs.

Tips: JSON parser lagle signature mismatch hoy. Tai raw body must.

## Fees & Limits
- `PLATFORM_FEE_PERCENTAGE` — default often 20%.
- `MINIMUM_PAYMENT_AMOUNT`, `MAXIMUM_PAYMENT_AMOUNT` — system range (e.g., $5 – $10,000).
- Currency: primarily `usd`, expandable.

Example (Fee split): `$100` payment → Platform fee `20%` = `$20` → Freelancer gets `$80` via transfer.

## Env Vars
- `STRIPE_SECRET_KEY` — server backend key
- `STRIPE_PUBLISHABLE_KEY` — frontend key
- `STRIPE_WEBHOOK_SECRET` — webhook verify secret
- `PLATFORM_FEE_PERCENTAGE`, `MINIMUM_PAYMENT_AMOUNT`, `MAXIMUM_PAYMENT_AMOUNT`

## Terms Dictionary (Simple)
- Payment Intent: Stripe er “payment plan” object; confirm korle pay hoy.
- Client Secret: Frontend token to confirm payment.
- Escrow: Taka “held” thakar concept; kaj sesh hole release.
- Transfer: Platform theke freelancer Stripe account e taka move.
- Payout: Freelancer Stripe theke bank e taka jawa.
- Platform Fee: Service er commission; auto-collect.
- Held/Released/Refunded: Local payment status lifecycle.
- Onboarding: Freelancer er Stripe setup & verification.
- Signature: Webhook authenticity check header.
- Raw Body: Original request payload; verify korte eita dorkar.

## Practical Example — Step by Step
1) Freelancer onboarding complete.
2) Poster bid accept kore; backend PaymentIntent create.
3) Frontend card confirm; Stripe webhook → `payment_intent.succeeded`.
4) Local DB: status `HELD`.
5) Poster kaj complete mark kore → transfer to freelancer; status `RELEASED`.
6) Jodi problem hoy → `POST /refund/:paymentId` diye refund.

## Debug & Testing

### Webhook Endpoint — Signing Secret Mismatch (Stripe)
- Symptom: `Signature verification failed` / `constructEvent` error; payment status update hoy na.
- Stripe Dashboard e “Recent deliveries” te `400`/signature invalid dekhte paren.

- Root cause:
  - Stripe e multiple webhook endpoints (e.g., `nayem5001` vs `nayem5000`) — pratyek er alada “Signing secret”.
  - Backend `.env` e sudhu ekta `STRIPE_WEBHOOK_SECRET` thake; jodi Stripe onno endpoint e deliver kore, secret mismatch hoy.

- Quick Fix (Production/Test):
  1) Stripe Dashboard → Developers → Webhooks → chosen endpoint open korun (e.g., `https://nayem5001.binarybards.online/api/v1/payments/webhook`).
  2) Mode confirm korun: Test vs Live backend er sathe match korte hobe.
  3) “Signing secret” copy kore `.env` e `STRIPE_WEBHOOK_SECRET=` update korun.
  4) Server restart korun.
  5) Duplicate/extra endpoint disable/delete korun jate confusion na thake.
  6) Verify: Dashboard → “Recent deliveries” → “Send test webhook” (`payment_intent.succeeded`) → logs e “Stripe webhook verified” dekhe payment status `HELD` update hocche ki.

- Extra checks:
  - Raw body middleware thik ache: `express.raw({ type: 'application/json' })` sudhu webhook path e; `express.json()` webhook e apply kora jabena.
  - Endpoint URL exact match: scheme (`https`/`http`), domain/subdomain, port, path `/api/v1/payments/webhook`.
  - CORS `Origin: undefined` normal for Stripe; eta issue na.
  - Stripe CLI test korle CLI er generated `whsec_*` secret use korte hobe (session-specific); production e Dashboard er secret use korun.

- Playbook jodi abar fail hoy:
  - New endpoint create kore same URL set korun; new secret diye deploy kore dekhen.
  - Local test: `stripe listen --forward-to http://localhost:<PORT>/api/v1/payments/webhook` + `stripe trigger payment_intent.succeeded`.
  - Logs e `stripe-signature` header asche ki, event handler e type mapping hit hocche ki check korun.
- Stripe CLI: `stripe listen --forward-to http://localhost:<PORT>/api/v1/payments/webhook`
- Triggers: `stripe trigger payment_intent.succeeded` / `payment_intent.payment_failed` / `account.updated`
- Common error: Signature invalid → check raw body middleware & correct endpoint.

## Where To Look (Files)
- Routes: `src/app/modules/payment/payment.routes.ts`
- Controller: `payment.controller.ts`, `webhook.controller.ts`
- Service: `payment.service.ts`
- Interfaces/Enums: `payment.interface.ts`
- Config: `src/config/stripe.ts`
- App middleware: `src/app.ts` (webhook raw body)