# টাস্ক টাইটান্স – স্ট্রাইপ ভিত্তিক এসক্রো পেমেন্ট সিস্টেম (বাংলা টেকনিক্যাল ডক)

এই ডকুমেন্টে পুরো পেমেন্ট সিস্টেমের কাজের ধাপ, প্রয়োজনীয় সেটআপ, API ও ওয়েবহুক ব্যবহারের নিয়ম, “হার্ড রিফ্রেশ” হলে `client_secret` পুনরুদ্ধারের কৌশল, সিকিউরিটি/আইডেম্পোটেন্সি এবং ডিজাইন যুক্তি তুলে ধরা হয়েছে।

---

## ১) ওভারভিউ
- সিস্টেমটি Stripe (Stripe Connect) ব্যবহার করে  এসক্রো(escrow)-স্টাইল পেমেন্ট পরিচালনা করে।
- `Bid` গ্রহণের সময় ব্যাকএন্ড `PaymentIntent` তৈরি করে এবং ফ্রন্টএন্ডে `client_secret` দেয়।
- ওয়েবহুক ইভেন্ট (`payment_intent.amount_capturable_updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`) দ্বারা পেমেন্টের লাইফসাইকেল আপডেট হয়।
- ব্রাউজার হার্ড রিফ্রেশ হলে, `GET /api/v1/payments/by-bid/:bidId/current-intent` এন্ডপয়েন্ট দিয়ে বর্তমান `PaymentIntent` ও `client_secret` (যদি প্রযোজ্য) পুনরুদ্ধার করা যায়।

## ২) প্রি-রিকুইজিটস
এই অংশে Stripe অ্যাকাউন্ট, কী/ENV সেটিংস, ওয়েবহুক এবং অ্যাপ URL/অথেন্টিকেশনসহ প্রয়োজনীয় সব প্রস্তুতি তুলে ধরা হলো।

### ২.১ Stripe অ্যাকাউন্ট টাইপ ও প্রস্তুতি
- প্ল্যাটফর্ম অ্যাকাউন্ট: প্রধান Stripe অ্যাকাউন্ট যেখানে API কী থাকবে।
- Stripe Connect (ঐচ্ছিক কিন্তু রেকমেন্ডেড এসক্রোর জন্য): টাস্কার/সার্ভিস প্রোভাইডারদের কনেক্টেড অ্যাকাউন্টে পেমেন্ট ট্রান্সফার/পেআউট করতে চাইলে Stripe Connect সক্রিয় করুন。
- অ্যাক্টিভেশন: ড্যাশবোর্ডে পেমেন্টস অ্যাক্টিভেট করুন (টেস্ট/লাইভ মোড পার্থক্য বুঝে নিন)。
- টেস্ট মোড: প্রথমে `Test mode` এ কাজ করুন; টেস্ট কার্ড ব্যবহার করুন (যেমন `4242 4242 4242 4242`)。

#### ২.১.১ Stripe Connect কী, কেন দরকার, না হলে কী হয় (ফুল ডিটেইলস)
- Stripe Connect কী:
  - একটি মার্কেটপ্লেস/প্ল্যাটফর্মে গ্রাহক (`Poster`) থেকে সরবরাহকারী/টাস্কার (`Tasker`)—এ টাকা পৌঁছানোর নিরাপদ ও কমপ্লায়েন্ট অবকাঠামো。
  - প্ল্যাটফর্ম অ্যাকাউন্টের অধীনে নানা `Connected Account` (Standard/Express/Custom) তৈরি/লিংক করা হয়。
  - ফান্ড ফ্লো কন্ট্রোল, কমিশন (`application_fee_amount`), ট্যাক্স/কমপ্লায়েন্স (KYC), পেআউট—সব Stripe হ্যান্ডল করে。

- কেন দরকার:
  - মার্কেটপ্লেসে অর্থ গ্রহণ করে অন্য অ্যাকাউন্টে পাঠানো (পেআউট/ট্রান্সফার) বৈধভাবে করতে。
  - প্ল্যাটফর্ম কমিশন কাটতে (`application_fee_amount`) এবং বাকিটা টাস্কারের অ্যাকাউন্টে পাঠাতে。
  - ইউজার KYC/কমপ্লায়েন্স নিশ্চিত করতে (টাস্কারের পরিচয়/ব্যাংক তথ্য স্ট্রাইপে ভেরিফাই হয়)。
  - রিফান্ড/ডিসপিউট হলে ভাগ করে হ্যান্ডল করতে (প্ল্যাটফর্ম/টাস্কারের অংশ অনুযায়ী)।

- না হলে কী হয়:
  - সব টাকা প্ল্যাটফর্মের অ্যাকাউন্টে জমা হবে; টাস্কারে দিতে আলাদা অফ-প্ল্যাটফর্ম ব্যাংক ট্রান্সফার/হিসাব রাখতে হবে。
  - কমপ্লায়েন্স রিস্ক (ট্যাক্স, KYC, অডিট ট্রেইল দুর্বল)।
  - অটোমেটেড পেআউট/রিপোর্টিং থাকবে না; স্কেলিং কঠিন。

- ফান্ড ফ্লো মডেল (Stripe-এর অপশন):
  - Destination Charges: প্ল্যাটফর্ম `PaymentIntent` তৈরি করে, `transfer_data[destination]` দিয়ে টাস্কারের Connected Account নির্দিষ্ট করে; Stripe অটোমেটিকভাবে ফান্ড টাস্কারে ট্রান্সফার করে। প্ল্যাটফর্ম কমিশন `application_fee_amount` দিয়ে নেয়。
  - Direct Charges: টাস্কারের অ্যাকাউন্টে সরাসরি চার্জ—গ্রাহকের কার্ড টোকেন কানেক্টেড অ্যাকাউন্টে ব্যবহার হয়। প্ল্যাটফর্ম ফি কনফিগ আলাদা。
  - Separate Transfers: আগে প্ল্যাটফর্মে ফান্ড আসে, পরে `transfers` API দিয়ে টাস্কারে পাঠানো হয়—এসক্রো-স্টাইল কন্ট্রোলের জন্য ভালো。
  - `on_behalf_of`: ইনভয়েসিং/ট্যাক্স পারপাসে চার্জ টাস্কারের পক্ষ থেকে হচ্ছে তা বোঝাতে。
  - `application_fee_amount`: প্ল্যাটফর্ম কমিশন কাটা。
  - `capture_method: manual`: কার্ড অথরাইজেশন ধরে রেখে পরে ক্যাপচার করা—ডেলিভারি/স্বীকৃতির পরে ক্যাপচার করলে এসক্রো-সদৃশ নিয়ন্ত্রণ পাওয়া যায়。

- আমাদের প্রোজেক্টের কনটেক্সটে কী যুক্তিযুক্ত:
  - এটি একটি মার্কেটপ্লেস (Poster → Tasker)। তাই Stripe Connect রেকমেন্ডেড。
  - যদি সত্যিকারের “হোল্ড” প্রয়োজন (ডেলিভারি কনফার্মের পরে ক্যাপচার): `capture_method: manual` + ওয়েবহুক-ড্রিভেন ক্যাপচার বা Separate Transfers মডেল বিবেচনা করুন。
  - যদি Connect ছাড়া শুরু করতে চান: ফান্ড প্ল্যাটফর্মে থাকবে; টাস্কারে পেআউট অফ-প্ল্যাটফর্ম করতে হবে—দীর্ঘমেয়াদে কমপ্লায়েন্স/অটোমেশন চ্যালেঞ্জিং。

- অ্যাকাউন্ট টাইপ ব্রিফ:
  - Standard: ইউজারের নিজস্ব Stripe অ্যাকাউন্ট; কমপ্লায়েন্স/ড্যাশবোর্ড ইউজার ম্যানেজ করে。
  - Express: লাইটওয়েট অনবোর্ডিং; প্ল্যাটফর্মে কিছু বেশি কন্ট্রোল。
  - Custom: ফুল কন্ট্রোল; প্ল্যাটফর্ম দায়িত্ব বেশি, ইমপ্লিমেন্টেশন জটিল。

- খরচ/ফি (হাই-লেভেল):
  - কার্ড প্রসেসিং ফি (দেশভেদে), Connect ফি/কমিশন。
  - `application_fee_amount` প্ল্যাটফর্মের কমিশন কনফিগার করে; Stripe ফি আলাদাভাবে প্রযোজ্য。

- কমপ্লায়েন্স টিপস:
  - KYC ভেরিফিকেশন সম্পন্ন না হলে পেআউট ব্লক হতে পারে。
  - টার্মস/প্রাইভেসি/রিফান্ড পলিসি পরিষ্কার রাখুন; ডিসপিউট হলে প্রক্রিয়া প্রস্তুত রাখুন。

#### ২.১.২ কে কে Stripe Connect অ্যাকাউন্ট সেটআপ করবে এবং কেন
- Platform/Marketplace Owner (কোম্পানি): প্ল্যাটফর্মের মূল `Stripe account` তৈরি করে `Stripe Connect` এনাবল করবে। কারণ: তৃতীয়-পক্ষ (Tasker/Seller) কে পেমেন্ট দেওয়ার জন্য `transfers/payouts`, কমিশন (`application_fee_amount`), ডিসপিউট/রিফান্ড, ওয়েবহুক সিকিউরিটি—এসব প্ল্যাটফর্ম-লেভেলে কনফিগার করতে হয়।
- Finance/Compliance/Admin: KYC/কমপ্লায়েন্স নীতিমালা ঠিক রাখে; টার্মস, রিফান্ড পলিসি, ট্যাক্স/রিপোর্টিং ইত্যাদি নিশ্চিত করে। প্রয়োজন হলে `payouts_enabled` শর্ত যাচাই করে।
- Engineering/Backend: `Connected Account` অনবোর্ডিং, `PaymentIntent`/`Transfers`, `webhook` হ্যান্ডলিং, `application_fee_amount`, `transfer_data[destination]`, `on_behalf_of` ইমপ্লিমেন্ট করে।
- Sellers/Taskers/Freelancers: নিজেদের `Connected Account` (সাধারণত `Express`) অনবোর্ড করে—ইমেইল/ব্যাংক যোগ, KYC ভেরিফাই। কেন: পেআউট পেতে হলে `charges_enabled` ও `payouts_enabled` সক্রিয় থাকা দরকার; না হলে টাকা পৌঁছাবে না বা দেরি হবে।
- Posters/Customers: তাদের `Connect account` দরকার নেই; তারা কার্ড/ওয়ালেট দিয়ে পেমেন্ট করে, ফান্ড ফ্লো প্ল্যাটফর্ম ও টাস্কারের মধ্যে ম্যানেজ হয়।

##### কখন Stripe Connect করা “উচিত”
- Multi-vendor/Marketplace বা দুই-পক্ষীয় প্ল্যাটফর্ম—যেখানে গ্রাহকের টাকা তৃতীয়-পক্ষ টাস্কার/সেলারকে দিতে হয়।
- অটোমেটেড payout/transfer দরকার, ম্যানুয়াল ব্যাংক ট্রান্সফার এড়াতে চান।
- কমিশন কাটার প্রয়োজন (`application_fee_amount`) এবং বাকি অংশ টাস্কারের অ্যাকাউন্টে যাবে।
- কমপ্লায়েন্স চাহিদা (KYC, disputes, refunds) পূরণ করতে চান; ফান্ড-ফ্লো ট্রেসেবল রাখতে চান।
- “Hold/Capture” বা “Separate Transfers” স্টাইল এসক্রো ফ্লো চাই—ফান্ড সেপারেশন প্রয়োজন।

##### কখন Connect না করলেও চলে (উদাহরণ)
- Single-seller e-commerce—সব বিক্রি প্ল্যাটফর্মই করে, তৃতীয়-পক্ষ payout নেই।
- ইন-হাউস সার্ভিস/পেরোল—গ্রাহকের পেমেন্ট তৃতীয়-পক্ষকে Stripe দিয়ে পাঠানো লাগছে না।
- যদি প্ল্যাটফর্মই “Merchant of Record” এবং কোনো third-party payout দরকার না হয়।

##### দ্রুত সিদ্ধান্তের চেকলিস্ট
- তৃতীয়-পক্ষকে টাকা পাঠাতে হবে? → হ্যাঁ হলে Connect নিন।
- কমিশন কাটবেন/Revenue-share করবেন? → করলে Connect সহায়ক।
- অটোমেটেড payouts চান? → Connect আবশ্যক।
- KYC/কমপ্লায়েন্স মেনে চলতে হবে? → Connect সহজ সমাধান।
### ২.২ Stripe API Keys ও ENV ভেরিয়েবল
- `STRIPE_SECRET_KEY` (আবশ্যক): সার্ভারের সিক্রেট কী (`sk_test_...` বা `sk_live_...`)。
- `STRIPE_WEBHOOK_SECRET` (আবশ্যক প্রোডাকশনে): ওয়েবহুক সিগনেচার ভেরিফাই করার সিক্রেট (Stripe CLI/ড্যাশবোর্ড থেকে পাওয়া)。
- `STRIPE_API_VERSION` (ঐচ্ছিক): নির্দিষ্ট API ভার্সন পিন করতে চাইলে。
- Connect সম্পর্কিত (প্রয়োজন হলে):
  - `STRIPE_CONNECT_CLIENT_ID` (OAuth ফ্লো থাকলে প্রয়োজন)。
  - কনেক্টেড অ্যাকাউন্ট আইডি রানটাইমে ইউজারের সাথে ম্যাপ করতে হবে (ডাটাবেস/অনবোর্ডিং স্টেপ অনুযায়ী)।
- অ্যাপ/সার্ভার ENV:
  - `BASE_URL` (ব্যাকএন্ড সার্ভারের পাবলিক URL, যেমন `https://api.example.com`)。
  - `PORT` (লোকাল রান পোর্ট, যেমন `5000`)。
  - `FRONTEND_URL` (ঐচ্ছিক; CORS/রিডাইরেক্টে দরকার হলে)।
- কোথায় ব্যবহার হয়:
  - `src/app/config/stripe.ts` এ `STRIPE_SECRET_KEY` দিয়ে Stripe SDK ইনিশিয়ালাইজ হয়。
  - ওয়েবহুক হ্যান্ডলার (`webhook.controller.ts`) এ `STRIPE_WEBHOOK_SECRET` দিয়ে সিগনেচার যাচাই হয়。

### ২.৩ ওয়েবহুক সেটআপ (লোকাল ও প্রোডাকশন)
- এন্ডপয়েন্ট: `POST /api/v1/payments/webhook`。
- সাবস্ক্রাইবড ইভেন্ট: `payment_intent.amount_capturable_updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`。
- লোকাল ডেভেলপমেন্ট (Stripe CLI):
  - রান: `stripe listen --forward-to http://localhost:<port>/api/v1/payments/webhook`
  - সাইনিং সিক্রেট নিন: CLI আউটপুটে `webhook signing secret` দেখাবে; সেটি `.env` এ `STRIPE_WEBHOOK_SECRET` হিসেবে রাখুন。
- প্রোডাকশন (ড্যাশবোর্ড):
  - Developers → Webhooks → Add endpoint → আপনার পাবলিক `BASE_URL/api/v1/payments/webhook` দিন。
  - সাবস্ক্রাইব ইভেন্টগুলো নির্বাচন করুন。
  - সাইনিং সিক্রেট কপি করে `STRIPE_WEBHOOK_SECRET` সেট করুন。
- সিকিউরিটি নোট:
  - ওয়েবহুক রিকোয়েস্টের কাঁচা বডি ব্যবহার করে `stripe.webhooks.constructEvent` দিয়ে সিগনেচার যাচাই করুন。
  - অবৈধ সিগনেচার হলে 400/401 দিয়ে রিজেক্ট করুন。
  - রিট্রাই নিরাপদ রাখতে সার্ভিস লেভেলে আইডেম্পোটেন্সি গার্ড দিন。

### ২.৪ অ্যাপ URL, অথেন্টিকেশন ও রোল
- `BASE_URL` সঠিকভাবে সেট করুন যাতে ওয়েবহুক ও API এন্ডপয়েন্ট এক্সপোজ হয়。
- অথেন্টিকেশন: Bearer টোকেন দিয়ে প্রটেক্টেড রুটে অ্যাক্সেস (লগইন করে টোকেন নিন; Postman কালেকশন রেপোতে আছে)。
- রোল পারমিশন:
  - `GET /api/v1/payments/by-bid/:bidId/current-intent` এন্ডপয়েন্টে `POSTER`, `TASKER`, `SUPER_ADMIN` রোল অনুমোদিত。

### ২.৫ ডেটা প্রি-কন্ডিশন (পেমেন্ট শুরুর আগে)
- একটি বৈধ `bidId` থাকা প্রয়োজন যা অ্যাকসেপ্টেবল স্টেটে আছে。
- বিড অ্যাকসেপ্ট করলে সার্ভার `PaymentIntent` তৈরি করে; এই ধাপেই `client_secret` ফ্রন্টএন্ডে পাঠানো হয়。
- Connect ব্যবহার করলে: সংশ্লিষ্ট টাস্কারের কনেক্টেড অ্যাকাউন্ট ভেরিফাইড/সক্ষম আছে কিনা নিশ্চিৎ করুন (নইলে ট্রান্সফার/পেআউটে সমস্যা হবে)。

### ২.৬ দ্রুত চেকলিস্ট
- [ ] Stripe অ্যাকাউন্ট টেস্ট মোডে প্রস্তুত。
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` `.env` এ আছে。
- [ ] ওয়েবহুক এন্ডপয়েন্ট লাইভ/লোকাল উভয় জায়গায় কনফিগ করা。
- [ ] `BASE_URL`, `PORT`, `FRONTEND_URL` সেট করা。
- [ ] অথ টোকেন নিয়ে প্রটেক্টেড রাউটে কল করা যায়。
- [ ] টেস্ট কার্ড দিয়ে ফ্লো রান করার জন্য ফ্রন্টএন্ড প্রস্তুত。

## ৩) মূল এন্টিটি ও স্ট্যাটাস
- `Bid.status`: `ACCEPTED`, `PAYMENT_PENDING` প্রভৃতি。
- `Payment.status` (লোকাল): `INITIALIZED`, `PAYMENT_PENDING`, `HELD` ইত্যাদি (প্রোজেক্ট অনুযায়ী)।
- Stripe `PaymentIntent.status`: `requires_payment_method`, `requires_confirmation`, `requires_action`, `processing`, `succeeded`, `canceled` ইত্যাদি。

## ৪) ব্যাকএন্ড API (মূল)
- `POST /api/v1/bids/:bidId/accept` → বিড গ্রহণ; `PaymentIntent` তৈরি; `client_secret` রিটার্ন。
- `POST /api/v1/payments/webhook` → Stripe ওয়েবহুক ইভেন্ট হ্যান্ডলিং。
- `GET /api/v1/payments/:paymentId` → পেমেন্ট ডিটেইলস。
- `GET /api/v1/payments/by-bid/:bidId/current-intent` → হার্ড রিফ্রেশের পর বর্তমান `PaymentIntent` ও `client_secret` রিট্রিভ (যদি স্ট্যাটাস অনুযায়ী সম্ভব)।
  - অথরাইজেশন: `POSTER`, `TASKER`, `SUPER_ADMIN` রোল (রাউটে প্রটেক্টেড)।
  - রেসপন্স উদাহরণ:
    ```json
    {
      "success": true,
      "message": "Current intent for bid fetched",
      "data": {
        "bidId": "<bidId>",
        "paymentId": "<localPaymentId>",
        "stripeIntentId": "pi_...",
        "stripeIntentStatus": "requires_action",
        "clientSecret": "pi_..._secret_..."
      }
    }
    ```
    - যদি স্ট্যাটাস `succeeded`/`canceled` বা `client_secret` প্রযোজ্য না হয়, তখন `clientSecret` `null` থাকবে এবং `stripeIntentStatus` থেকে UI সিদ্ধান্ত নেবে。

## ৫) সার্ভার কনফিগ ও কী ফাইল
- বেস রাউট মাউন্ট: `/api/v1/payments` (দেখুন: `src/app/routes/index.ts`)。
- রাউটস: `src/app/modules/payment/payment.routes.ts`
  - নতুন রাউট: `GET /by-bid/:bidId/current-intent` (কমেন্ট: `// Retrieve current intent and client_secret by bidId`)。
- কন্ট্রোলার: `src/app/modules/payment/payment.controller.ts`
  - হ্যান্ডলার: `getCurrentIntentByBidController`。
- সার্ভিস: `src/app/modules/payment/payment.service.ts`
  - মেথড: `getCurrentIntentByBid(bidId: string)` → Stripe থেকে কারেন্ট Intent রিট্রিভ করে প্রযোজ্য হলে `client_secret` দেয়。
- ওয়েবহুক: `src/app/modules/payment/webhook.controller.ts` এবং সম্পর্কিত সার্ভিস হ্যান্ডলার (যেমন `handleAmountCapturableUpdated`, `handlePaymentSucceeded`, `handlePaymentFailed`)。

## ৬) এন্ড-টু-এন্ড ফ্লো
1. ইউজার `Bid` গ্রহণ করে (`acceptBid`) → সার্ভার `PaymentIntent` তৈরি করে এবং ফ্রন্টএন্ডে `client_secret` পাঠায়。
2. ফ্রন্টএন্ড Stripe Elements দিয়ে পেমেন্ট কনফার্ম করে。
3. Stripe ওয়েবহুক ইভেন্ট আসে:
   - `payment_intent.amount_capturable_updated` → সিস্টেম ক্যাপচার ট্রিগার/হ্যান্ডল করে; লোকাল `Payment.status` ও `Bid.status` আপডেট করে。
   - `payment_intent.succeeded` → পেমেন্ট সফল; লোকাল স্ট্যাটাস `HELD`/সমতুল্য সেট; `Bid` `ACCEPTED`。
   - `payment_intent.payment_failed` → লোকাল স্ট্যাটাস ফেইল্ড; ইউজারকে রিট্রাই অপশন。
4. UI রিফ্রেশ হলে: `GET /api/v1/payments/by-bid/:bidId/current-intent` → কারেন্ট Intent ও `client_secret` রিট্রিভ (প্রযোজ্য হলে)。

## ৭) হার্ড রিফ্রেশের পর client_secret রিকভারি
- ক্লায়েন্ট-সাইড: `localStorage`/`sessionStorage` এ `bidId`, `paymentId`, `stripeIntentId`, `client_secret` সংরক্ষণ ও লোড。
- সার্ভার-সাইড (ফলব্যাক): `GET /api/v1/payments/by-bid/:bidId/current-intent`
  - সার্ভিস লোকাল পেমেন্ট খুঁজে পায়; স্ট্রাইপ Intent রিট্রিভ করে。
  - Intent স্ট্যাটাস যদি `requires_*`/`processing` হয়, তবেই `client_secret` দেয়; `succeeded`/`canceled` হলে `client_secret` `null`。

## ৮) ওয়েবহুক ভেরিফিকেশন ও হ্যান্ডলার
- Stripe সিগনেচার যাচাই করা হয় (ড্যাশবোর্ড/CLI থেকে আসা ইভেন্ট)।
- হ্যান্ডলারসমূহ:
  - `handleAmountCapturableUpdated` → ক্যাপচার-রিলেটেড আপডেট, স্ট্যাটাস সেট。
  - `handlePaymentSucceeded` → সফল পেমেন্ট; লোকাল পেমেন্ট/বিড আপডেট。
  - `handlePaymentFailed` → ব্যর্থ পেমেন্ট; রিট্রাই লজিক。
  - `handleAccountUpdated` → কনেক্টেড অ্যাকাউন্ট আপডেট সম্পর্কিত。
- ৩০-সেকেন্ড অটো-ক্যাপচার ফলব্যাক কোড অপসারণ করা হয়েছে; এখন সম্পূর্ণ ওয়েবহুক-ড্রিভেন ফ্লো。

## ৯) ব্যবহৃত Stripe API
- `paymentIntents.create` → নতুন Intent তৈরি; `client_secret` জেনারেট。
- `paymentIntents.retrieve` → কারেন্ট Intent স্ট্যাটাস ও ডিটেইলস。
- `paymentIntents.capture` → ক্যাপচার (যদি ম্যানুয়াল ক্যাপচার মোড/ফ্লো প্রয়োজন হয়)।

## ১০) ফ্রন্টএন্ড স্টেপস (হাই-লেভেল)
- বিড অ্যাকসেপ্টের পর `client_secret` নিন。
- Stripe Elements এর `confirmCardPayment(client_secret, …)` ব্যবহার করুন。
- পেজ লোডে:
  - লোকাল স্টোরেজে `client_secret` থাকলে সেটিই ব্যবহার করুন。
  - না থাকলে `GET /api/v1/payments/by-bid/:bidId/current-intent` কল করে Intent স্ট্যাটাস অনুযায়ী UI সিদ্ধান্ত নিন。

## ১১) লোকাল ডেভেলপমেন্ট ও টেস্টিং
- Stripe CLI দিয়ে ওয়েবহুক ফরওয়ার্ড:
  - `stripe listen --forward-to http://localhost:<port>/api/v1/payments/webhook`
- টেস্ট স্ক্রিপ্ট/গাইড (রেপো রুটে উপস্থিত): `test-webhook-*.js`, `manual-webhook-test-guide.md`, `step-by-step-test-guide.md` প্রভৃতি。

## ১২) ট্রাবলশুটিং চেকলিস্ট
- ওয়েবহুক ২ বার ট্রিগার হলে আইডেম্পোটেন্সি গার্ড আছে কিনা দেখুন。
- `Bid.status` ও `Payment.status` ট্রানজিশন সঠিক কিনা নিশ্চিত করুন。
- Stripe ড্যাশবোর্ডে PaymentIntent স্ট্যাটাস চেক করুন。
- হার্ড রিফ্রেশের পরে `current-intent` এন্ডপয়েন্ট রেসপন্স যাচাই করুন。

## ১৩) ডিজাইন র‍্যাশনাল
- ওয়েবহুক-কেন্দ্রিক ডিজাইন ডাবল-প্রসেসিং ও রেস কন্ডিশন কমায়。
- `current-intent` এন্ডপয়েন্ট ইউজার এক্সপেরিয়েন্স মজবুত করে; রিফ্রেশ/নেটওয়ার্ক ইস্যুতে ক্লায়েন্ট সিক্রেট পুনরুদ্ধার সম্ভব。
- আইডেম্পোটেন্সি গার্ডে ব্যাকএন্ড নিরাপদ; একই কাজ পুনরায় চালালে সাইলেন্টলি স্কিপ হয়。

## ১৪) রেফারেন্স ফাইল
- রাউট: `src/app/modules/payment/payment.routes.ts`
- কন্ট্রোলার: `src/app/modules/payment/payment.controller.ts`
- সার্ভিস: `src/app/modules/payment/payment.service.ts`
- ওয়েবহুক: `src/app/modules/payment/webhook.controller.ts`
- বেস রাউট ইনডেক্স: `src/app/routes/index.ts`

---

## অ্যাপেন্ডিক্স: উদাহরণ `curl`
```bash
# কারেন্ট Intent রিট্রিভ (বিড আইডি দিয়ে)
curl -H "Authorization: Bearer <token>" \
  http://localhost:<port>/api/v1/payments/by-bid/<bidId>/current-intent
```

```json
{
  "success": true,
  "message": "Current intent for bid fetched",
  "data": {
    "bidId": "123",
    "paymentId": "pay_abc",
    "stripeIntentId": "pi_123",
    "stripeIntentStatus": "requires_action",
    "clientSecret": "pi_123_secret_456"
  }
}
```

> নোট: `stripeIntentStatus` যদি `succeeded` হয়, `clientSecret` সাধারণত `null` থাকবে এবং UI সফল স্টেটে যাবে。

---

## সহজ সারসংক্ষেপ (Quick Summary)
- বিড অ্যাকসেপ্ট করলে সার্ভার Stripe `PaymentIntent` বানায় এবং `client_secret` ফ্রন্টএন্ডে দেয়।
- ইউজার Stripe Elements দিয়ে পেমেন্ট কনফার্ম করে; সফল হলে ওয়েবহুক স্ট্যাটাস আপডেট করে।
- হার্ড রিফ্রেশে `client_secret` হারালে `GET /api/v1/payments/by-bid/:bidId/current-intent` দিয়ে বর্তমান Intent ও `client_secret` ফেরত পাওয়া যায় (স্ট্যাটাস অনুযায়ী)।

## ধাপে ধাপে সেটআপ (Quick Start)
1) Stripe সিক্রেট কী `.env`/কনফিগে যোগ করুন: `STRIPE_SECRET_KEY`。
2) ওয়েবহুক URL সেট করুন: `POST /api/v1/payments/webhook`। লোকাল ডেভে Stripe CLI ব্যবহার করুন:
   - `stripe listen --forward-to http://localhost:<port>/api/v1/payments/webhook`
3) সার্ভার রান করুন এবং অ্যাপ ইউজার দিয়ে লগইন করে টোকেন নিন。
4) বিড অ্যাকসেপ্ট API কল করুন (`POST /api/v1/bids/:bidId/accept`) এবং রেসপন্স থেকে `client_secret` নিন。
5) ফ্রন্টএন্ডে Stripe Elements দিয়ে `client_secret` ব্যবহার করে পেমেন্ট কনফার্ম করুন。
6) সফল হলে UI আপডেট করুন; রিফ্রেশ হলে `current-intent` এন্ডপয়েন্ট দিয়ে পুনরুদ্ধার করুন。

## পেমেন্ট ফ্লো চিত্র (ASCII)
```
User accepts Bid
      |
      v
Server creates PaymentIntent  ---> returns client_secret
      |
      v
Frontend confirms card (Stripe Elements)
      |
      v
Stripe emits webhooks -------------------------------> Server webhook handler
      |                                                      |
      |                                                      v
      |                                           Update Payment/Bid status
      |
Hard refresh? ---------------> GET /payments/by-bid/:bidId/current-intent
                                     |
                                     v
                         Return current intent + client_secret (if applicable)
```

## API ব্যবহার উদাহরণ (সারাংশ)
- `POST /api/v1/bids/:bidId/accept` → `client_secret` সহ পেমেন্ট শুরু。
- `GET /api/v1/payments/by-bid/:bidId/current-intent` → কারেন্ট Intent ও `client_secret` (স্ট্যাটাস অনুযায়ী)。
- `POST /api/v1/payments/webhook` → Stripe ওয়েবহুক হ্যান্ডলিং。

## ফ্রন্টএন্ড উদাহরণ: রিফ্রেশের পর client_secret রিকভারি
```js
async function recoverClientSecret({ bidId, token }) {
  // 1) LocalStorage চেষ্টা
  const cached = localStorage.getItem(`cs:${bidId}`);
  if (cached) return JSON.parse(cached);

  // 2) সার্ভার ফলব্যাক
  const res = await fetch(`/api/v1/payments/by-bid/${bidId}/current-intent`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch intent');

  const { stripeIntentStatus, clientSecret } = json.data || {};
  // প্রযোজ্য হলে ক্যাশ করুন
  if (clientSecret) {
    localStorage.setItem(`cs:${bidId}`, JSON.stringify({ clientSecret, stripeIntentStatus }));
  }
  return { clientSecret, stripeIntentStatus };
}

// ব্যবহার উদাহরণ
// const { clientSecret, stripeIntentStatus } = await recoverClientSecret({ bidId, token });
// if (clientSecret) { await stripe.confirmCardPayment(clientSecret, { payment_method: { card } }); }
```

## স্ট্যাটাস বুঝে UI সিদ্ধান্ত
- `requires_payment_method` → কার্ড ইনপুট দেখান; ইউজার নতুন পেমেন্ট মেথড দিন。
- `requires_confirmation` → `client_secret` থাকলে `confirmCardPayment` চালান。
- `requires_action` → 3DS/চ্যালেঞ্জ UI দেখান; কনফার্মেশন সম্পন্ন করুন。
- `processing` → স্পিনার/লোডিং দেখান; ওয়েবহুকের জন্য অপেক্ষা করুন。
- `succeeded` → সফল স্ক্রিন; `client_secret` আর প্রয়োজন নেই。
- `canceled`/`payment_failed` → রিট্রাই অপশন দেখান。

## সিকিউরিটি ও আইডেম্পোটেন্সি (হাই-লেভেল)
- ওয়েবহুক সিগনেচার যাচাই করুন; অবৈধ রিকোয়েস্ট রিজেক্ট করুন。
- একই বিড/পেমেন্টের ডাবল-প্রসেসিং এড়াতে স্ট্যাটাস চেক দিয়ে গার্ড দিন。
- উদাহরণ পসুডো-গার্ড:
```ts
if (bid.status !== 'PAYMENT_PENDING') { /* silently skip */ return; }
```

## FAQ (প্রায় জিজ্ঞাসিত প্রশ্ন)
- প্রশ্ন: হার্ড রিফ্রেশে `client_secret` কেন থাকে না?
  - উত্তর: `client_secret` ক্লায়েন্ট-সাইডে থাকে; রিফ্রেশে ইন-মেমরি ডেটা হারায়। তাই লোকালস্টোরেজ বা সার্ভার ফলব্যাক দরকার。
- প্রশ্ন: `succeeded` হলে কেন `client_secret` `null`?
  - উত্তর: সফল Intent এর জন্য পুনরায় কনফার্মেশন দরকার হয় না; তাই `client_secret` সাধারণত ফেরত দেওয়া হয় না。
- প্রশ্ন: ডাবল-চার্জ কিভাবে এড়াব?
  - উত্তর: ওয়েবহুক-ড্রিভেন আপডেট + সার্ভিসে আইডেম্পোটেন্সি গার্ড ব্যবহার করুন; UI তে সফল হলে কনফার্মেশন রিপিট না করুন。
- প্রশ্ন: লোকাল ডেভে ওয়েবহুক টেস্ট?
  - উত্তর: Stripe CLI দিয়ে `listen` করুন এবং ওয়েবহুক এন্ডপয়েন্টে ফরওয়ার্ড করুন。

## কমন ইস্যু ও ফিক্স
- সমস্যা: ওয়েবহুক দুইবার আসছে。
  - ফিক্স: ইভেন্ট আইডি/স্ট্যাটাস ভিত্তিক গার্ড; একই প্রসেসিং এড়ান。
- সমস্যা: `client_secret` খুঁজে পাচ্ছেন না。
  - ফিক্স: `current-intent` এন্ডপয়েন্ট কল করুন; স্ট্যাটাস অনুযায়ী সিদ্ধান্ত নিন。
- সমস্যা: UI প্রসেসিংয়ে আটকে আছে。
  - ফিক্স: ওয়েবহুক লগ চেক করুন; `processing` থেকে `succeeded`/`failed` ট্রানজিশন নিশ্চিত করুন。