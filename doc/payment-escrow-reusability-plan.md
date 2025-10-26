# Stripe Escrow System – Reusable Architecture Plan (BN)

## Overview
Ei plan-er goal holo existing escrow flow-ke pura reusable module-e convert kora, jate onno project-eo easily plug-in kora jay. API responses unchanged rakha, readability + testability barano, Stripe-specific logic-ke clean adapter-e move kora.

## Key Principles
- Port/Adapter pattern: Domain service independent, provider adapter (Stripe) pluggable
- Config centralization: `DEFAULT_CURRENCY` + fee utils ek jaygay
- No hard-coded values: `'usd'` ber kore config-driven
- Testable blocks: small helpers + clear repositories
- Webhook consistency: single event dispatcher with small handlers

## Proposed Module Layout
```
src/app/modules/escrow-reusable/
├── domain/
│   ├── escrow.service.ts          // create/release/refund + orchestration
│   └── types.ts                   // request/response interfaces
├── providers/
│   ├── payment-provider.port.ts   // IPaymentProvider interface
│   └── stripe.provider.ts         // StripeProvider implementation
├── repositories/
│   ├── payment.repo.port.ts       // IPaymentRepository
│   ├── bid.repo.port.ts           // IBidRepository
│   ├── stripe-account.repo.port.ts// IStripeAccountRepository
│   └── mongoose/                  // current project adapters
│       ├── payment.repo.mongoose.ts
│       ├── bid.repo.mongoose.ts
│       └── stripe-account.repo.mongoose.ts
├── helpers/
│   ├── fees.ts                    // platformFee, freelancerAmount
│   ├── currency.ts                // dollarsToCents, DEFAULT_CURRENCY use
│   ├── metadata.ts                // buildIntentMetadata(...)
│   └── validation.ts              // input validation + guards
├── webhook/
│   ├── webhook.handler.ts         // central dispatcher (provider-agnostic)
│   └── event-map.ts               // event → domain updates mapping
└── index.ts                       // exports for consumers
```

## Current Dependencies (from codebase)
- Stripe: `src/config/stripe.ts` → `stripe`, `dollarsToCents`, fee utils
- Models: `PaymentModel`, `StripeAccountModel`, `BidModel`, `TaskModel`
- Shared utils: `ApiError`, `httpStatus`, `sendResponse`, `catchAsync`
- Payment logic: `payment.service.ts`, `webhook.controller.ts`, `payment.interface.ts`

## Public API (Reusable Service)
- `createEscrowPayment(req)` → `{ payment, clientSecret }`
- `releaseEscrowPayment(paymentId, releaseType?)` → `{ success }`
- `refundEscrowPayment(paymentId, reason?)` → `{ success, refund_id }`
- `getCurrentIntentByBid(bidId)` → `{ intentId, status }`
- `handleWebhookEvent(event)` → `void`

## Ports (Interfaces)
- `IPaymentProvider` (Stripe impl)
  - `createPaymentIntent({ amount, currency, metadata, capture_method })`
  - `capturePaymentIntent(intentId)`
  - `createRefund({ intentId, reason, metadata })`
  - `constructWebhookEvent(rawBody, signature, secret)`
- `IPaymentRepository`
  - `createPaymentRecord(data)` / `updatePaymentStatus(id, status)`
  - `getPaymentsByBid(bidId)` / `isExistPaymentById(id)`
- `IBidRepository`
  - `getBidWithTask(bidId)` (+ populate task)
- `IStripeAccountRepository`
  - `isExistAccountByUserId(userId)` / `chargesEnabled/payoutsEnabled`

## Helpers (inside domain module)
- `getBidWithTask(bidId)`
- `ensureFreelancerOnboarded(userId)`
- `ensureNoExistingPayment(bidId)`
- `calculateFees(amount)` → `{ platformFee, freelancerAmount }`
- `buildIntentMetadata({ bidId, posterId, freelancerId, taskTitle })`
- `createEscrowIntent({ amount, currency, metadata })` via provider
- `createPaymentRecord({ data, intent, fees })`

## Webhook Strategy
- Single dispatcher: `handleWebhookEvent(event)` → event-map → small handlers:
  - `payment_intent.succeeded` → payment status `held`
  - `payment_intent.payment_failed` → status `failed`
  - `payment_intent.amount_capturable_updated` → capture-ready
  - `account.updated` → StripeAccount flags update
- Signature verify via provider `constructWebhookEvent`
- Avoid duplication with `webhook.controller.ts` by routing to reusable handler

## Step-by-Step Migration Plan
1) Snapshot & Baseline
- Run `create-test-payment-flow.js` + API smoke to capture current behavior.

2) Config centralization
- `src/config/stripe.ts`: `export const DEFAULT_CURRENCY = 'usd'`
- Replace hard-coded `'usd'` with `DEFAULT_CURRENCY` across module.

3) Define Ports & Adapters
- Create provider port + `StripeProvider` using existing `stripe` client.
- Create repository ports; implement Mongoose adapters using existing Models.

4) Helpers & Fees
- Move fee calc to `helpers/fees.ts` using current logic.
- Add `dollarsToCents` passthrough; consume `DEFAULT_CURRENCY`.

5) Refactor `createEscrowPayment`
- Flow: validate → onboarded check → duplicate guard → fees → intent → DB → return
- Keep `capture_method: 'manual'`; ensure metadata parity.

6) Light pass on Release/Refund
- Extract authorization + intent capture/refund wrappers via provider.
- Update statuses (`held` → `released` / `refunded`) consistently.

7) Webhook Unify
- Use reusable `webhook.handler.ts` inside `payment.routes.ts` / controller.
- Map existing event handling logic to event-map.

8) Tests + Docs
- Unit: ports + helpers + domain service
- Integration: webhook routes + payment flow
- Docs: update `payment-readability-refactor-plan.md` references + examples

9) QA & Ship
- Lint/format; run manual payment flow; verify API responses unchanged.

## Env & Config Requirements
- `STRIPE_SECRET` (API key)
- `STRIPE_WEBHOOK_SECRET`
- `DEFAULT_CURRENCY` (from `src/config/stripe.ts`)
- Optional: platform account configs if needed later

## Usage in Another Project (Example)
```ts
import { EscrowService, StripeProvider, MongooseRepos } from 'escrow-reusable';

const provider = new StripeProvider({ stripe, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET });
const repos = new MongooseRepos({ PaymentModel, BidModel, StripeAccountModel });

const escrow = new EscrowService({ provider, repos, currency: DEFAULT_CURRENCY });

// Create payment
const { payment, clientSecret } = await escrow.createEscrowPayment({
  bidId, taskId, amount, posterId, freelancerId
});

// Webhook route
app.post('/webhook', rawBodyMiddleware, async (req, res) => {
  const event = provider.constructWebhookEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET!);
  await escrow.handleWebhookEvent(event);
  res.json({ received: true });
});
```

## Deliverables
- New: `src/app/modules/escrow-reusable/` (structure above)
- Modified: `src/config/stripe.ts` (`DEFAULT_CURRENCY`), `payment.service.ts` (refactor to use reusable domain or migrate gradually)
- Routes/Controllers: point webhook + payment endpoints to reusable service

## Migration Checklist
- [ ] Add `DEFAULT_CURRENCY` and replace hard-coded currency
- [ ] Implement ports for provider + repositories
- [ ] Move helpers (6) and fees logic
- [ ] Refactor `createEscrowPayment` to use new helpers
- [ ] Extract small helpers for release/refund/webhooks
- [ ] Update tests + docs
- [ ] Lint/format + manual run

## Notes
- Keep behavior identical during refactor; changes are additive and modular.
- If any issue, swap back to existing `payment.service.ts` implementation; config stays.