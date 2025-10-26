# স্ট্রাইপ – অল-ইন-ওয়ান কুইক মাস্টার গাইড (বাংলা)

এই গাইড পড়লে Stripe নিয়ে বেসিক থেকে অ্যাডভান্সড—সবকিছু সহজে বুঝবেন: কী লাগে, কিভাবে পেমেন্ট কাজ করে, Stripe Connect, Webhook, টেস্টিং, সাধারণ ভুল ও সমাধান, এবং প্রয়োজনীয় কোড উদাহরণ।

---

## ১) দ্রুত সারসংক্ষেপ
- Stripe একটি পেমেন্ট প্ল্যাটফর্ম; কার্ড/ওয়ালেট/ব্যাংক ইত্যাদি দিয়ে পেমেন্ট নেওয়া যায়।
- মূল ধারণা: `PaymentIntent` → গ্রাহকের পেমেন্টের লাইফসাইকেল ট্র্যাক করে।
- Marketplace হলে `Stripe Connect` দিয়ে তৃতীয়-পক্ষ (Tasker/Seller) কে টাকা পাঠানো/পেআউট করা যায়।
- নির্ভরযোগ্য আপডেটের জন্য `webhooks`; টেস্টের জন্য `Stripe CLI`।

## ২) কী লাগবে (Prerequisites)
- Stripe অ্যাকাউন্ট (Test mode দিয়ে শুরু, পরে Live)।
- API Keys: `STRIPE_SECRET_KEY` (server side) এবং প্রয়োজন হলে `STRIPE_WEBHOOK_SECRET`।
- অ্যাপের `.env` ফাইলে কী সেট করুন; কোডে সরাসরি হার্ডকোড করবেন না।
- যদি Connect দরকার হয়: টাস্কারদের `Connected Account` (Express/Standard) অনবোর্ডিং করাতে হবে।

### ENV উদাহরণ
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2024-06-01
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:5000
```

#### Publishable Key লাগে কি?
- হ্যাঁ, যদি ফ্রন্টএন্ডে `Stripe.js`/`Stripe Elements` ব্যবহার করেন। ফ্রন্টএন্ডে Stripe ইনিশিয়ালাইজ করতে `publishable key` (`pk_test_...` বা `pk_live_...`) দরকার হয়।
- সার্ভার-অনলি কাজ (যেমন কেবল ব্যাকএন্ডে Intent তৈরি করে অন্য সিস্টেমে পাঠানো) হলে `publishable key` প্রয়োজন হয় না—সেখানে `secret key`-ই যথেষ্ট।
- সিকিউরিটি: `publishable key` ক্লায়েন্টে এক্সপোজ করা নিরাপদ; কিন্তু `secret key` কখনোই ক্লায়েন্টে দেবেন না।

##### ফ্রন্টএন্ড উদাহরণ (Publishable Key সহ)
```html
<script src="https://js.stripe.com/v3"></script>
<script>
  // আপনার ফ্রন্টএন্ড কনফিগ/ENV থেকে pk নিন
  const stripe = Stripe('pk_test_XXXXXXXXXXXXXXXXXXXXXXXX');

  async function pay(clientSecret) {
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement, // Stripe Elements card
      },
    });
    if (result.error) {
      console.error(result.error.message);
    } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
      console.log('Payment succeeded');
    }
  }
</script>
```

##### কোথায় রাখবেন
- ফ্রন্টএন্ড ফ্রেমওয়ার্কে (React/Vite/Next.js) সাধারণত `VITE_STRIPE_PUBLISHABLE_KEY` বা `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` নামে পাবলিক ENV ব্যবহার করুন।
- ব্যাকএন্ড থেকে `publishable key` সার্ভ করতে চাইলে একটি পাবলিক কনফিগ এন্ডপয়েন্ট রাখতে পারেন (`GET /api/config/stripe`)—কিন্তু সাধারণত সরাসরি ফ্রন্টএন্ড ENV-ই যথেষ্ট।

---

## ৩) পেমেন্ট বেসিকস (PaymentIntent)
- `PaymentIntent` = একটি পেমেন্ট অ্যাটেম্পটের লাইফসাইকেল অবজেক্ট।
- সাধারণ স্ট্যাটাস: `requires_payment_method`, `requires_confirmation`, `requires_action`, `processing`, `succeeded`, `canceled`।
- `client_secret` = ফ্রন্টএন্ডে পেমেন্ট কনফার্ম করার জন্য টোকেন; সার্ভার থেকে তৈরি হয়, ক্লায়েন্টে ব্যবহার হয়।
- `capture_method`
  - `automatic` (ডিফল্ট): কনফার্মের সাথে সাথে চার্জ সম্পন্ন。
  - `manual`: প্রথমে অথরাইজেশন (hold), পরে `capture`—এসক্রো-সদৃশ নিয়ন্ত্রণের জন্য।
- Idempotency: একই রিকোয়েস্ট রিপিট হলেও ডুপ্লিকেট চার্জ না হয়—সেজন্য `Idempotency-Key` ব্যবহার করুন।

### Node উদাহরণ: PaymentIntent তৈরি
```ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const intent = await stripe.paymentIntents.create({
  amount: 5000, // $50.00 → cents
  currency: 'usd',
  payment_method_types: ['card'],
  capture_method: 'automatic',
  description: 'Task payment #123',
});
// intent.client_secret ফ্রন্টএন্ডে দিন
```

### Manual Capture (Escrow-স্টাইল)
```ts
const intent = await stripe.paymentIntents.create({
  amount: 5000,
  currency: 'usd',
  payment_method_types: ['card'],
  capture_method: 'manual',
});
// Confirm পরে, ডেলিভারি নিশ্চিত হলে:
await stripe.paymentIntents.capture(intent.id, {
  amount_to_capture: 5000, // আংশিক/পূর্ণ ক্যাপচার
});
```

---

## ৪) Stripe Connect (Marketplace)
- কাজ: গ্রাহকের টাকা তৃতীয়-পক্ষ টাস্কার/সেলার-এর `Connected Account`-এ পাঠানো, কমিশন কাটা, পেআউট করা।
- অ্যাকাউন্ট টাইপ: `Standard`, `Express`, `Custom`—কন্ট্রোল/জটিলতা ভেদে।
- ফান্ড ফ্লো মডেল:
  - Destination Charges: `transfer_data[destination]` দিয়ে টাস্কার অ্যাকাউন্টে অটো ট্রান্সফার; `application_fee_amount` দিয়ে কমিশন。
  - Direct Charges: টাস্কারের অ্যাকাউন্টে সরাসরি চার্জ。
  - Separate Transfers: আগে প্ল্যাটফর্মে ফান্ড, পরে `transfers` API দিয়ে টাস্কারে পাঠান。
- কেন দরকার: অটোমেটেড payouts, কমিশন, কমপ্লায়েন্স (KYC), ডিসপিউট/রিফান্ড হ্যান্ডলিং。

### Destination Charge উদাহরণ
```ts
const intent = await stripe.paymentIntents.create({
  amount: 5000,
  currency: 'usd',
  payment_method_types: ['card'],
  application_fee_amount: 500, // $5 কমিশন
  transfer_data: {
    destination: 'acct_1234567890', // টাস্কারের Connected Account
  },
});
```

### Separate Transfer উদাহরণ
```ts
// 1) গ্রাহকের কাছ থেকে পেমেন্ট নিন (প্ল্যাটফর্মে আসে)
const intent = await stripe.paymentIntents.create({ amount: 5000, currency: 'usd' });
// intent succeeded হওয়ার পর:
await stripe.transfers.create({
  amount: 4500,
  currency: 'usd',
  destination: 'acct_1234567890',
  description: 'Payout to tasker for job #123',
});
```

### Onboarding Link (Express)
```ts
const account = await stripe.accounts.create({ type: 'express', country: 'US' });
const link = await stripe.accountLinks.create({
  account: account.id,
  type: 'account_onboarding',
  refresh_url: `${process.env.FRONTEND_URL}/onboarding/refresh`,
  return_url: `${process.env.FRONTEND_URL}/onboarding/complete`,
});
```

---

## ৫) Webhooks (Behind the Scenes)
- Stripe ইভেন্ট → আপনার সার্ভারের এন্ডপয়েন্টে POST করে。
- হেডার: `Stripe-Signature`; Raw body থেকে `stripe.webhooks.constructEvent` দিয়ে সিগনেচার যাচাই করুন。
- ইভেন্ট টাইপ উদাহরণ: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.amount_capturable_updated`, `account.updated`。
- রিট্রাই: Stripe ব্যর্থ হলে পুনরায় পাঠায়—হ্যান্ডলার idempotent রাখুন。

### Verify + Route উদাহরণ (Node)
```ts
import Stripe from 'stripe';
import express from 'express';
import bodyParser from 'body-parser';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const app = express();

// Raw body দরকার
app.post('/api/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        // লোকাল ডাটাবেস আপডেট, নোটিফাই, ইত্যাদি
        break;
      }
      case 'payment_intent.amount_capturable_updated': {
        const intent = event.data.object as Stripe.PaymentIntent;
        // manual capture ট্রিগার/লজিক
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        // ব্যর্থতার হ্যান্ডলিং
        break;
      }
      default:
        // অন্যান্য ইভেন্ট লগ
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook verify failed:', err);
    res.status(400).send('Bad request');
  }
});
```

### লোকাল টেস্টিং (Stripe CLI)
- Login: `stripe login`
- Listen: `stripe listen --forward-to http://localhost:5000/api/webhooks/stripe`
- Trigger: `stripe trigger payment_intent.succeeded`

---

## ৬) সাধারণ ফ্লো (Step-by-Step)
- One-off Card Payment (Connect ছাড়া):
  1) সার্ভারে `PaymentIntent` তৈরি → `client_secret` ফ্রন্টএন্ডে。
  2) ফ্রন্টএন্ডে Stripe Elements দিয়ে `confirmCardPayment`。
  3) ওয়েবহুক `succeeded` নিশ্চিত করে লোকাল স্ট্যাটাস আপডেট।

- Marketplace – Destination Charge:
  1) টাস্কারের `Connected Account` অনবোর্ড নিশ্চিত。
  2) `transfer_data[destination]` + `application_fee_amount` সহ Intent তৈরি。
  3) কনফার্ম → ওয়েবহুক → টাস্কারে অটো ট্রান্সফার; কমিশন প্ল্যাটফর্মে।

- Escrow – Manual Capture:
  1) `capture_method: 'manual'` Intent。
  2) গ্রাহক পেমেন্ট কনফার্ম → `amount_capturable_updated` ইভেন্ট。
  3) ডেলিভারি নিশ্চিত হলে `capture` কল; ব্যর্থ হলে ক্যান্সেল/রিফান্ড。

---

## ৭) Refunds & Disputes
- Refund: `stripe.refunds.create({ payment_intent: intent.id, amount })`。
- Full বনাম Partial: `amount` দিয়ে নির্ধারণ করুন。
- Dispute (চ্যালেঞ্জ): Dashboard-এ evidence দিন; outcome অনুযায়ী ফান্ড এডজাস্ট হয়。

---

## ৮) টেস্টিং টুলস
- Test cards: `4242 4242 4242 4242` (সাকসেস), 3DS টেস্ট কার্ড, ফেইলিউর কার্ড—Stripe ডক্সে তালিকা。
- Stripe CLI: listen/trigger; সাইনিং সিক্রেট নিন。
- Dashboard: Logs → Events, Webhooks, Payments。

---

## ৯) Dashboard এসেনশিয়ালস
- Developers → API keys: Test/Live keys。
- Developers → Webhooks: এন্ডপয়েন্ট, সাইনিং সিক্রেট。
- Payments: PaymentIntents, Refunds。
- Connect: Accounts, Payouts, Transfers。

---

## ১০) সিকিউরিটি ও কমপ্লায়েন্স
- Keys সিক্রেট রাখুন; `.env` ব্যবহার করুন; রিপো/লগে ফাঁস করবেন না。
- `client_secret` কেবল ক্লায়েন্টে ব্যবহার; লোকালস্টোরেজে রাখলে মেয়াদ দেখে হ্যান্ডল করুন।
- SCA/3DS: `requires_action` হলে ফ্রন্টএন্ডে 3DS challenge দিন।
- PCI: Stripe Elements/SDK ব্যবহার করলে PCI burden কমে。
- Idempotency: রিট্রাই-সেইফ সার্ভার লজিক রাখুন。

---

## ১১) Troubleshooting (কমন ইস্যু)
- “Webhook verify failed”: Raw body না ব্যবহার; সাইনিং সিক্রেট ভুল。
- “No such payment_intent”: ভুল ID বা Test vs Live mismatch。
- “You cannot capture”: Intent manual নয় বা capturable নয়。
- “Transfers failed”: Connected account `payouts_enabled` না; KYC pending。
- “Payment failed”: কার্ড ডিক্লাইন; `payment_intent.payment_failed` ইভেন্ট চেক।

---

## ১২) API চিটশিট (Node)
- Create Intent: `stripe.paymentIntents.create({ amount, currency })`
- Confirm (client): `stripe.confirmCardPayment(clientSecret)`
- Capture: `stripe.paymentIntents.capture(intentId, { amount_to_capture })`
- Refund: `stripe.refunds.create({ payment_intent: intentId, amount })`
- Transfer: `stripe.transfers.create({ amount, currency, destination })`
- Onboarding link: `stripe.accountLinks.create({...})`

---

## ১৩) গ্লসারি (বাংলা-ইংরেজি)
- PaymentIntent: পেমেন্ট লাইফসাইকেল অবজেক্ট。
- client_secret: ক্লায়েন্টে পেমেন্ট কনফার্মের টোকেন。
- capture (manual): পরে চার্জ ফাইনাল করা。
- Connected Account: টাস্কার/সেলার-এর Stripe অ্যাকাউন্ট。
- transfer: প্ল্যাটফর্ম → টাস্কার অর্থ পাঠানো。
- payout: টাস্কারের Stripe ব্যাল্যান্স → ব্যাংকে পাঠানো。

---

পড়তে সহজ রাখার জন্য এই গাইডে বেসিক থেকে স্টেপ-by-স্টেপ কাজ দেখানো হয়েছে। প্রয়োজনে আপনার বর্তমান প্রোজেক্টের API/রাউট নামসহ কাস্টম উদাহরণ যোগ করে নিতে পারেন।