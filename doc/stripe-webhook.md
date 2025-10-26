## 🔄 Task Titans Stripe Webhook — Current Implementation (Repo-specific Quick Reference)

- Webhook endpoint: `POST /api/v1/payments/webhook`
- API base prefix: `'/api/v1'` (mounted in `src/app.ts`), payment routes mounted at `'/payments'` (`src/routes/index.ts`)
- Raw body middleware (signature verify-safe) set at app-level:
  - `src/app.ts`: `app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));`
  - JSON parser is skipped for any path containing `'/webhook'`
- Signature verification: `src/app/modules/payment/webhook.controller.ts`
  - `stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)`
- Handled event types (controller + service):
  - `payment_intent.succeeded` → local payment set to `HELD`
  - `payment_intent.payment_failed` → local payment `REFUNDED`, bid/task revert logic
  - `payment_intent.amount_capturable_updated` → manual capture performed, then set to `HELD`
  - `account.updated` → Stripe Connect account capability/status sync
  - `transfer.created`, `transfer.updated` → transfer logs/processing
  - `payout.created`, `payout.updated` → payout logs/processing
  - `charge.dispute.created` → dispute logs hook
- Important paths/files:
  - Routes: `src/app/modules/payment/payment.routes.ts` (`/webhook` under `/payments`)
  - App middleware: `src/app.ts` (raw body + skip JSON on webhook paths)
  - Controller: `src/app/modules/payment/webhook.controller.ts`
  - Service: `src/app/modules/payment/payment.service.ts`
  - Stripe config: `src/config/stripe.ts`
- Env vars used:
  - `STRIPE_SECRET_KEY` (server-side key)
  - `STRIPE_WEBHOOK_SECRET` (from Stripe Dashboard/CLI)
  - `STRIPE_PUBLISHABLE_KEY` (frontend key)
  - `PLATFORM_FEE_PERCENTAGE`, `MINIMUM_PAYMENT_AMOUNT`, `MAXIMUM_PAYMENT_AMOUNT`
- Stripe API version: set in `src/config/stripe.ts` via `apiVersion`
- Test locally with Stripe CLI (replace `<PORT>` with your `PORT` in `.env`):
  - `stripe listen --forward-to http://localhost:<PORT>/api/v1/payments/webhook`
  - Triggers: `stripe trigger payment_intent.succeeded` / `payment_intent.payment_failed` / `payment_intent.amount_capturable_updated` / `account.updated`
- Debug logging: controller prints header presence, body size, and first 200 chars of raw body to help diagnose signature issues.

---

### 🧩 1. What is a Webhook?

Webhook mane holo — ekta **callback system** jekhane external service (e.g., Stripe) **amader server ke data pathay** jodi kono event hoy (e.g., payment successful).
👉 Example:
Stripe bollo — “Ei user er payment hoye geche”, then Stripe send kore ekta HTTP POST request **`/api/v1/payments/webhook`** route e.

---

### ⚙️ 2. Problem ta kothay hoy?

Stripe (ba onno service) **raw JSON** format e signature soho data pathay.
E data verify korar jonno (Stripe signature check) tumi **exact raw body** lagbe — mane express.json() use korle se automatically parse kore dei (object e convert kore dey) — tai **original raw data harai**.
Taile verification fail hoye jete pare.

---

### 💡 3. Ei line ta ki kore:

```js
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));
```

Eta bole:

> “Ei specific route `/api/v1/payments/webhook` er jonno **raw body** use koro, JSON e convert korba na.”

So, webhook route e incoming data unchanged thakbe.
Ekhon Stripe signature verify kora possible. ✅

---

### 💡 4. E line ta ki kore:

```js
app.use((req, res, next) => {
  if (req.path.includes('/webhook')) {
    return next(); // Skip JSON parsing for webhook routes
  }
  express.json()(req, res, next);
});
```

Ei middleware ta bole:

> “Jodi route e `/webhook` thake, taile JSON parser apply korba na, baki sob route e express.json() apply koro.”

🔹 Mane: Webhook ছাড়া সব route এ normally JSON parsing হবে (req.body ke JS object e convert korbe).
🔹 Webhook route e skip korbe, jate raw body preserved thake.

---

### 💡 5. Ei line ta:

```js
app.use(express.urlencoded({ extended: true }));
```

Eta mainly **form data** handle korar jonno use hoy.
Jodi kono HTML form theke data ase (like `application/x-www-form-urlencoded` type), tahole eta parse kore **req.body** te object banay.

---

### ✅ Summary Table

| Middleware                                  | Purpose                                                            | Applies to                      |
| ------------------------------------------- | ------------------------------------------------------------------ | ------------------------------- |
| `express.raw({ type: 'application/json' })` | Keep raw JSON body (needed for signature verification like Stripe) | Only `/api/v1/payments/webhook` |
| `express.json()`                            | Parse JSON requests (normal API routes)                            | All routes except `/webhook`    |
| `express.urlencoded({ extended: true })`    | Parse form submissions (HTML forms)                                | All routes                      |

---

### 🔐 Analogy:

Bujhar easy way —
ধরো তুমি একটা চিঠি (JSON data) পেলে।

- Normally express.json() চিঠিটা খুলে পড়ে, ভিতরের data ke object বানায়।
- কিন্তু webhook এর ক্ষেত্রে, তোমাকে চিঠিটা **খোলা অবস্থায় না**, বরং **ঠিক যেমন পাঠানো হয়েছে তেমনভাবে (raw)** রাখতে হয় — কারণ তাতে একটা **signature seal** থাকে যেটা verify করতে হবে।
  যদি খোলে ফেলো, seal ভেঙে যাবে — verification fail. 🚫

Besh, cholo ami tomake ekta **Stripe Webhook verify korar full working example** dei — step by step so that bujhte paro keno raw body use hoy and kibhabe Stripe er signature verify kora hoy. 👇

---

## 🧱 Step 1: Basic Express setup

```js
import express from 'express';
import Stripe from 'stripe';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

---

## ⚙️ Step 2: Webhook route er jonno raw body use kora

Stripe jodi kono event (like `payment_intent.succeeded`) send kore,
tahole Stripe raw JSON body pathay, ja verify korte hoy using `stripe.webhooks.constructEvent()`.

```js
// 🔸 Step 2.1: Webhook route e raw body lagbe
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

// 🔸 Step 2.2: Baki sob route e JSON parser use kora
app.use((req, res, next) => {
  if (req.path.includes('/webhook')) {
    return next(); // Skip JSON parser for webhook
  }
  express.json()(req, res, next);
});

app.use(express.urlencoded({ extended: true }));
```

---

## 🧩 Step 3: Create the webhook route

Stripe jokhon webhook hit kore, se ekta **signature header** (`stripe-signature`) pathay.
Tumi eita diye verify korbe je request ta asole Stripe theke asche kina.

```ts
// src/app/modules/payment/payment.routes.ts
router.post('/webhook', WebhookController.handleStripeWebhook);
// Mounted at: /api/v1/payments/webhook (see src/routes/index.ts and src/app.ts)
```

```ts
// src/app/modules/payment/webhook.controller.ts (signature verify)
const sig = req.headers['stripe-signature'] as string;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
```

---

## 🗝️ Step 4: Normal JSON routes (example)

Baki sob API route gulo ektu normal vabe kaj korbe.

```js
app.post('/api/v1/payments/create', (req, res) => {
  const { amount, currency } = req.body;
  res.send(`Creating payment of ${amount} ${currency}`);
});
```

---

## ✅ Step 5: Run the server

```js
app.listen(5000, () => {
  console.log('🚀 Server running on port 5000');
});
```

---

## 📦 Step 6: Stripe Webhook Test

Local development e test korar jonno Stripe CLI use korte paro:

```bash
stripe listen --forward-to http://localhost:<PORT>/api/v1/payments/webhook
# Example (if PORT=3000):
# stripe listen --forward-to http://localhost:3000/api/v1/payments/webhook
```

Eta Stripe er event gulo automatically forward kore dibe tomader local route e.

---

## 🔍 Recap Table

| Step                   | What Happens                  | Why Important                     |
| ---------------------- | ----------------------------- | --------------------------------- |
| `express.raw()`        | Keeps request body unmodified | Needed for signature verification |
| `constructEvent()`     | Verify request from Stripe    | Ensures it's not fake             |
| `express.json()`       | For all normal routes         | Parse JSON normally               |
| `express.urlencoded()` | For form submissions          | Parse form data                   |

---

## 🧠 Analogy:

Think like this —
Stripe holo ekta “official messenger” je ekta **sealed envelope (signature soho)** pathay.
`express.json()` holo ekta helper je envelope khule data pore.
Kintu ekhane tumi envelope khulte parba na — tumi age **seal verify** korte hobe.
Tai `express.raw()` use kore envelope untouched rakhle Stripe bole “ha, eta amar seal-i chhilo.” ✅

