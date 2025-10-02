# Redis ইন্টিগ্রেশন গাইড (বাংলা)

এই ডকুমেন্টে খুব সহজ ভাষায় Redis কী, কেন ব্যবহার করবেন, আপনার বর্তমান প্রোজেক্টে কীভাবে যুক্ত আছে, এবং একদম নতুন (ফ্রেশ) প্রোজেক্টে A–Z সেটআপ—সবকিছু ধাপে ধাপে দেখানো হলো। উদাহরণগুলো আপনার কোডবেসের আসল ফাইলগুলোর সাথেই মিলানো হয়েছে।

## কেন Redis
- দ্রুত রেসপন্স: ঘনঘন পড়া হয় এমন ডেটা ক্যাশ করলে API ত্বরিত হয়।
- সার্ভার লোড কমে: ডাটাবেস/থার্ড-পার্টি API কল কমে যায়।
- রেট-লিমিট: সংবেদনশীল রুটে অপব্যবহার ঠেকাতে নির্ভরযোগ্য কাউন্টার।
- স্কেলিং: মাল্টি-ইনস্ট্যান্স বা Docker/WSL-এ শেয়ার্ড ক্যাশ সহজ হয়।

## প্রি-রিকুইজিটস
- লোকাল মেশিনে Redis চালানোর ব্যবস্থা (Docker বা WSL ভালো)।
- Node.js ও npm ইনস্টল।

## কুইক স্টার্ট
1) Redis চালু করুন:
   - Docker: `docker run -p 6379:6379 --name redis -d redis:latest`
   - Windows (WSL): `sudo apt-get install redis-server && sudo service redis-server start`
2) `.env` এ দিন: `REDIS_URL=redis://localhost:6379`
3) ডিপেন্ডেন্সি ইনস্টল করুন: `npm install ioredis --save`
4) সার্ভার চালান: `npm run dev`
5) নিচের ক্যাশ ও রেট-লিমিট উদাহরণগুলো দিয়ে টেস্ট করুন।

## আপনার প্রোজেক্টে কোথায় কী আছে
- `src/config/redis.ts`: `getRedisClient()` দিয়ে ioredis ক্লায়েন্ট তৈরি ও বেসিক ইভেন্ট লগিং। `redisPing()` দিয়ে হেলথ চেক।
- `src/app/shared/CacheHelper.ts`: Redis + NodeCache ফfallback সহ ক্যাশ ইউটিলিটি, `getOrSet`, ট্যাগ-ভিত্তিক ইনভ্যালিডেশন, এবং Express `cacheMiddleware`।
- `src/app/middlewares/rateLimit.ts`: Redis-ভিত্তিক রেট-লিমিট (ফfallback হিসেবে NodeCache)। অপশন: `windowMs`, `max`, `keyResolver`, `routeName`।

## রাউট-লেভেল ক্যাশিং (middleware)
যে কোনো `GET` রুটে দ্রুত রেসপন্সের জন্য `CacheHelper` এর বিল্ট-ইন `cacheMiddleware(ttl)` ব্যবহার করুন:

```ts
import { CacheHelper } from '../../shared/CacheHelper';
const cache = CacheHelper.getInstance();

router.get(
  '/items',
  cache.cacheMiddleware(120), // 120 সেকেন্ড TTL
  controller.getItems
);
```

বিঃদ্রঃ এখানে কী অটো-জেনারেট হয়: `route:<originalUrl>`। ইউজার-স্কোপড ক্যাশ দরকার হলে সার্ভিস-লেভেল `getOrSet` ব্যবহার করুন।

## সার্ভিস-লেভেল ক্যাশ (getOrSet)
হট ডেটা ক্যাশ করতে `getOrSet(key, fetchFn, ttl)` ব্যবহার করুন:

```ts
import { CacheHelper } from '../shared/CacheHelper';
const cache = CacheHelper.getInstance();

async function getUserSummary(userId: string) {
  const key = `user:summary:${userId}`;
  return cache.getOrSet(key, async () => {
    // আসল ডেটা ফেচ
    const summary = await userRepo.fetchSummary(userId);
    return summary;
  }, 300); // TTL 300s
}
```

## রেট-লিমিট middleware
সংবেদনশীল রুটে অপব্যবহার ঠেকাতে ফিক্সড উইন্ডো রেট-লিমিট:

```ts
import { rateLimitMiddleware } from '../../middlewares/rateLimit';

router.post(
  '/refund/:paymentId',
  rateLimitMiddleware({
    routeName: 'refund',
    windowMs: 15 * 60 * 1000, // 15 মিনিট
    max: 5,
    // চাইলে ইউজার-স্কোপড লিমিট
    keyResolver: (req) => (req.user?.id ? `user:${req.user.id}` : req.ip)
  }),
  controller.refund
);
```

## কী-নেমিং ও TTL বেস্ট-প্র্যাক্টিস
- কী-নেমিং ফরম্যাট: `namespace:entity:identifier`
  - উদাহরণ: `payment:detail:<paymentId>`, `payment:history:<userId>`
- TTL (সেকেন্ড):
  - রিড-ইনটেনসিভ/কম-পরিবর্তনশীল: 120–300s
  - দ্রুত পরিবর্তনশীল: 30–60s বা ক্যাশ না করা
- আপডেট/ওয়েবহুক হলে সংশ্লিষ্ট কী ইনভ্যালিডেট করুন।

## ক্যাশ ইনভ্যালিডেশন (প্রোজেক্টের ইউটিলিটি দিয়ে)
- নির্দিষ্ট কী মুছতে: `cache.del('payment:detail:<id>')`
- ট্যাগ-ভিত্তিক ইনভ্যালিডেশন:
  - সেট করার সময়: `cache.setWithTags(key, value, ['payment'], ttl)`
  - ইনভ্যালিডেট করতে: `cache.invalidateByTag('payment')`
- রেডিমেড হেল্পার:
  - `cache.invalidateUser(userId)`
  - `cache.invalidateTask(taskId)`

## টেস্টিং স্টেপস
1) সার্ভার চালান: `npm run dev`
2) প্রথমবার `GET /items` কল করুন — DB থেকে আসবে (কিছুটা সময় লাগতে পারে)।
3) দ্বিতীয়বার একই রুট কল — ক্যাশ থেকে দ্রুত আসবে (লগ/সময়ে পার্থক্য দেখবেন)।
4) `POST /refund/:paymentId` ১৫ মিনিটে ৫ বারের বেশি কল করলে `429` দেখুন।
5) প্রয়োজনমতো অন্য `GET` রুটে `cacheMiddleware(ttl)` যোগ করে বারবার কল করে পার্থক্য দেখুন।

## ট্রাবলশুটিং
- Redis কানেকশন সমস্যা:
  - Redis চলছে কিনা দেখুন: `docker ps` বা `redis-cli ping` → `PONG`
  - `.env` এ `REDIS_URL` সঠিক কিনা নিশ্চিত করুন
  - কোডে `redisPing()` দিয়ে হেলথ চেক করতে পারেন
- ক্যাশ কাজ করছে না:
  - লগে `[Redis] Error:` দেখলে NodeCache fallback সক্রিয় আছে কিনা দেখুন
  - কী-নেমিং/TTL সঠিক কিনা যাচাই করুন
- TypeScript বিল্ড এরর:
  - Redis-নিরপেক্ষ—সংশ্লিষ্ট জায়গায় টাইপ-গার্ড বা সঠিক টাইপ যোগ করুন

## প্রোডাকশন টিপস
- সেনসিটিভ/পার্সোনাল ডেটা ক্যাশ করবেন না; করলে ইউজার-স্কোপড কী ব্যবহার করুন
- অবজারভেবিলিটি: কানেকশন/মেমরি/হিট-রেশিও মনিটরিং যুক্ত করুন
- হাই-অ্যাভেইলেবিলিটি: Redis Cluster/Replica বিবেচনা করুন
- সুন্দর ডিগ্রেডেশন: Redis ডাউন হলে NodeCache fallback—সিস্টেম চালু থাকে

## পরবর্তী ধাপ
- ওয়েবহুক-ইভেন্টে রিলেটেড কী ইনভ্যালিডেট করুন (payment/user অ্যাগ্রিগেট হলে বিশেষভাবে)
- রিড-হেভি রুটগুলোতে ধীরে ধীরে ক্যাশ বাড়ান
- হিট/মিস রেশিও দেখে TTL টিউন করুন

---

যে কোনো প্রশ্ন বা সহযোগিতা দরকার হলে জানাবেন — এই গাইডটি ফলো করলে Redis সেটআপ, ব্যবহার ও টেস্ট সহজেই করতে পারবেন।

---

# Redis A–Z: কনসেপ্ট, প্যাটার্ন, প্রোজেক্টে ব্যবহার

## 1) Redis কী — সহজ ভাষায়
- ইন-মেমরি কী–ভ্যালু ডেটাবেইজ, খুব দ্রুত
- স্ট্রিং/লিস্ট/সেট/হ্যাশ/সোর্ডেড-সেট সাপোর্ট
- `TTL` দিলে সময় শেষে কী নিজে নিজে মুছে যায়
- ক্যাশিং, রেট-লিমিট, কিউ, সেশন—বহু কাজে ব্যবহৃত

## 2) দরকারি কনসেপ্ট
- `TTL/EXPIRE`: কত সেকেন্ড পরে কী ডিলিট হবে
- `Keyspace`: ভালো নেমিংে ম্যানেজমেন্ট সহজ
- `Pub/Sub`: নোটিফাই/ইনভ্যালিডেশন ব্রডকাস্টে কাজে লাগে
- `Persistence (RDB/AOF)`: ক্যাশিং ফোকাসে সাধারণত দরকার নেই

## 3) ক্যাশিং প্যাটার্ন
- Cache-Aside (Lazy Loading):
  - আগে ক্যাশ চেক, না থাকলে সোর্স থেকে ফেচ, ক্যাশে রেখে রিটার্ন
  - আমাদের `CacheHelper.getOrSet` এই প্যাটার্ন অনুসরণ করে
- Read-Through (মিডলওয়্যার-ভিত্তিক): রুটে অটো-ক্যাশ, `cacheMiddleware(ttl)`
- Write-Through: লেখার সময়ই ক্যাশ আপডেট (জটিল, দরকারে ব্যবহার)

## 4) রেট-লিমিটিং প্যাটার্ন
- Fixed Window (এখানে ব্যবহার): নির্দিষ্ট উইন্ডোতে নির্দিষ্ট রিকোয়েস্ট
- Sliding Window: রোলিং উইন্ডো—আরও সঠিকতা
- Token/Leaky Bucket: স্মার্ট থ্রটলিং

## 5) এই প্রোজেক্টে কীভাবে জুড়েছে
- `src/config/redis.ts`: ioredis ক্লায়েন্ট, ইভেন্ট লগ, `redisPing`
- `CacheHelper.ts`: সার্ভিস/রুট-লেভেল ক্যাশ, ট্যাগ-ইনভ্যালিডেশন
- `rateLimit.ts`: IP/রুট/ইউজার-স্কোপড রেট-লিমিট (fallback সহ)
- Fallback: Redis না থাকলে NodeCache—সার্ভিস ডাউন হয় না

## 6) কী-নেমিং — বাস্তব উদাহরণ
- `payment:detail:<paymentId>`
- `payment:history:<userId>`
- `dashboard:stats`
- `dashboard:revenue:monthly`

## 7) Invalidations — কবে কী মুছবেন
- ওয়েবহুক/আপডেট ইভেন্টে সংশ্লিষ্ট কী
- ট্যাগ-ভিত্তিক গ্রুপ মুছতে `invalidateByTag('...')`
- ম্যানুয়াল: `cache.del(key)`

## 8) আপনার বর্তমান প্রোজেক্টে ধাপে ধাপে
- Redis চালু করুন, `.env` ঠিক করুন, ডিপেন্ডেন্সি ইনস্টল
- `GET` রুটে `cacheMiddleware(ttl)` যোগ করুন
- সার্ভিসে `getOrSet(key, fetchFn, ttl)` ব্যবহার করুন
- সংবেদনশীল `POST`/`PATCH` রুটে `rateLimitMiddleware({ windowMs, max })`

## 9) একদম নতুন (ফ্রেশ) প্রোজেক্টে A–Z
1) `npm init -y && npm i express ioredis`
2) মিনিমাল Redis ক্লায়েন্ট:
```ts
import Redis from 'ioredis';
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
```
3) সিম্পল `getOrSet`:
```ts
export async function getOrSet(key: string, fn: () => Promise<any>, ttl = 120) {
  const v = await redis.get(key);
  if (v) return JSON.parse(v);
  const data = await fn();
  await redis.set(key, JSON.stringify(data), 'EX', ttl);
  return data;
}
```
4) সিম্পল রেট-লিমিট:
```ts
export function rateLimit({ windowMs, max }: { windowMs: number; max: number; }) {
  return async (req: any, res: any, next: any) => {
    const key = `ratelimit:${req.path}:${req.ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, Math.ceil(windowMs / 1000));
    if (count > max) return res.status(429).json({ message: 'Too many requests' });
    next();
  };
}
```
5) রাউট উদাহরণ:
```ts
app.get('/items', async (req, res) => {
  const data = await getOrSet('items:list', async () => fetchFromDB(), 120);
  res.json(data);
});
```

## 10) CLI দিয়ে দ্রুত চেক
- `redis-cli ttl <key>` → TTL দেখুন
- `redis-cli get <key>` → ক্যাশড JSON দেখুন

## 11) সিকিউরিটি ও বেস্ট প্র্যাক্টিস
- সেনসিটিভ ডেটা ক্যাশ না করা বা ইউজার-স্কোপড করা
- রোল/স্কোপ ভেদে রেসপন্স ভিন্ন হলে কী-তে বাড়তি স্কোপ যোগ করুন
- TTL ছোট রাখুন; স্টেল হলে ইনভ্যালিডেট করুন

## 12) অবজারভেবিলিটি
- কানেকশন হেলথ (`redisPing`), হিট/মিস লগিং
- মেমরি ইউসেজ/এভিকশন মনিটরিং

## 13) সাধারণ সমস্যা ও সমাধান
- কানেক্ট হতে না পারলে: URL/সার্ভিস চেক করুন
- 429 বেশি হলে: `windowMs`/`max` টিউন করুন
- বিল্ড টাইপ এরর: সংশ্লিষ্ট টাইপ-গার্ড যোগ করুন

এই গাইড ফলো করলে ধারণা → সেটআপ → ব্যবহার—সবকিছু এক জায়গায় পরিষ্কার থাকবে।

এই ডকুমেন্টে আপনার প্রোজেক্টে Redis ব্যবহার করে ক্যাশিং ও রেট-লিমিট কীভাবে সেটআপ, ব্যবহার ও টেস্ট করবেন — খুব সহজ ভাষায় ধাপে ধাপে দেখানো হয়েছে।

## কেন Redis
- দ্রুত রেসপন্স: ঘনঘন হিট হওয়া ডেটা ক্যাশ করে API দ্রুত হয়।
- লোড কমে: ডাটাবেস ও তৃতীয়-পক্ষ API কল কমে যায়।
- রেট-লিমিট: সংবেদনশীল রুটে অপব্যবহার ঠেকাতে কনসিসটেন্ট কাউন্টার।
- স্কেলিং: মাল্টি-ইনস্ট্যান্স/ডকারে শেয়ার্ড ক্যাশ।

## প্রি-রিকুইজিটস
- আপনার লোকাল মেশিনে Redis চালানো যাবে এমন ব্যবস্থা (Docker বা WSL ভালো অপশন)।
- Node.js ও npm ইনস্টল থাকা।

## কুইক স্টার্ট
1) Redis চালু করুন:
   - Docker: `docker run -p 6379:6379 --name redis -d redis:latest`
   - লোকাল (Windows): WSL বা Docker ব্যবহার করা উত্তম।
2) `.env` এ Redis URL দিন:
   - `REDIS_URL=redis://localhost:6379`
3) ডিপেন্ডেন্সি নিশ্চিত করুন:
   - `npm install ioredis --save`
4) সার্ভার চালান:
   - `npm run dev`
5) ক্যাশ ও রেট-লিমিট টেস্ট করুন (নিচে ধাপে ধাপে দেওয়া আছে)।

## কনফিগারেশন ফাইলসমূহ
- `src/config/redis.ts`: Redis ক্লায়েন্ট (singleton) তৈরি ও সংযোগ যাচাই (ping)।
- `src/app/shared/CacheHelper.ts`: Redis-backed ক্যাশিং ইউটিলিটি ও Express `cacheMiddleware`।
- `src/app/middlewares/rateLimit.ts`: Redis-backed রেট-লিমিট middleware (fallback হিসেবে NodeCache)।
- `.env`: `REDIS_URL` কনফিগারেশন।

## কী পরিবর্তন হয়েছে (রাউট-লেভেল ক্যাশিং ও রেট-লিমিট)
- Payment রাউটস (`src/app/modules/payment/payment.routes.ts`):
  - `GET /api/v1/payments/history` → ক্যাশ TTL 120s
  - `GET /api/v1/payments/:paymentId` → ক্যাশ TTL 120s
  - `POST /api/v1/payments/refund/:paymentId` → রেট-লিমিট (১৫ মিনিটে সর্বোচ্চ ৫টি রিকোয়েস্ট)
- Admin রাউটস (`src/app/modules/admin/admin.route.ts`):
  - `GET /api/v1/dashboard/stats` → ক্যাশ TTL 180s
  - `GET /api/v1/dashboard/revenue/monthly` → ক্যাশ TTL 300s

## Redis চালু করা (Windows টিপস)
- Docker ব্যবহার করুন: `docker run -p 6379:6379 --name redis -d redis:latest`
- WSL (Ubuntu) ইনস্টল থাকলে: `sudo apt-get install redis-server && sudo service redis-server start`
- তারপর `.env` এ `REDIS_URL=redis://localhost:6379` রাখুন।

## কীভাবে ক্যাশ middleware ব্যবহার করবেন
যে কোনো `GET` রুটে দ্রুত রেসপন্সের জন্য `CacheHelper.cacheMiddleware` লাগাতে পারেন:

```ts
import CacheHelper from '../../shared/CacheHelper';

router.get(
  '/items',
  CacheHelper.cacheMiddleware('items:list', 120), // 120 সেকেন্ড TTL
  controller.getItems
);
```

বিঃদ্রঃ ক্যাশ কী (`items:list`) ইউনিক ও স্থির হওয়া ভালো। যদি ইউজার-ভিত্তিক হয়, কী-এর মধ্যে ইউজার আইডি যোগ করুন (যেমন `items:list:<userId>`)।

## সার্ভিস-লেভেল ক্যাশ ব্যবহার (getOrSet)
সার্ভিসে হট ডেটা ক্যাশ করতে:

```ts
import CacheHelper from '../shared/CacheHelper';

async function getUserSummary(userId: string) {
  const key = `user:summary:${userId}`;
  return CacheHelper.getOrSet(key, 300, async () => {
    // আসল ডেটা ফেচ
    const summary = await userRepo.fetchSummary(userId);
    return summary;
  });
}
```

## রেট-লিমিট middleware ব্যবহার
সংবেদনশীল রুটে অপব্যবহার ঠেকাতে:

```ts
import { rateLimitMiddleware } from '../../middlewares/rateLimit';

router.post(
  '/refund/:paymentId',
  rateLimitMiddleware({
    keyPrefix: 'refund',
    windowSeconds: 900, // 15 মিনিট
    maxRequests: 5
  }),
  controller.refund
);
```

`keyPrefix` বদলে বিভিন্ন রুটে আলাদা কোটার মতো আচরণ তৈরি করা যায়। IP ভিত্তিক কী ইউজ করা হয়; চাইলে ইউজার আইডির সাথে কম্বাইন করা যেতে পারে।

## কী-নেমিং ও TTL বেস্ট-প্র্যাক্টিস
- কী-নেমিং: `namespace:entity:identifier` ফরম্যাট রাখুন।
  - উদাহরণ: `payment:detail:<paymentId>`, `payment:history:<userId>`
- TTL (সেকেন্ড):
  - রিড-ইনটেনসিভ/কম-পরিবর্তনশীল ডেটা: 120–300s
  - খুব দ্রুত পরিবর্তনশীল ডেটা: 30–60s বা ক্যাশ না করা
- ওয়েবহুক বা আপডেট হলে প্রাসঙ্গিক কী ইনভ্যালিডেট করুন।

## ক্যাশ ইনভ্যালিডেশন
- নির্দিষ্ট কী মুছতে: `CacheHelper.del('payment:detail:<id>')`
- ট্যাগ-ভিত্তিক ইনভ্যালিডেশন (যদি ট্যাগ ব্যবহার করেন): `CacheHelper.invalidateTags(['payment', 'user:<id>'])`
- ওয়েবহুক ইভেন্টে (Stripe/Payment) আপডেট হলে:
  - `payment:detail:<paymentId>`
  - `payment:history:<userId>`
  - সংশ্লিষ্ট অ্যাগ্রিগেট/স্ট্যাটস কী—যদি থাকে—মুছে দিন।

## টেস্টিং স্টেপস
1) সার্ভার চালান: `npm run dev`
2) প্রথমবার `GET /api/v1/payments/history` কল করুন — DB থেকে আসবে।
3) দ্বিতীয়বার কল করুন — ক্যাশ থেকে দ্রুত রেসপন্স আসবে (হেডার/লগে বোঝা যাবে)।
4) `POST /api/v1/payments/refund/:paymentId` রুটে ৫ বারের বেশি ১৫ মিনিটে কল করলে `429` আসছে কিনা দেখুন।
5) Admin রুটগুলোতে (`/dashboard/stats`, `/dashboard/revenue/monthly`) বারবার কল করে কনসিস্টেন্ট দ্রুত রেসপন্স দেখুন।

## ট্রাবলশুটিং
- সার্ভার স্টার্টে Redis কানেকশন এরর:
  - Redis চালু আছে কিনা দেখুন (`docker ps` বা `redis-cli ping` → `PONG`).
  - `.env` এ `REDIS_URL` সঠিক কিনা নিশ্চিত করুন।
- TypeScript বিল্ড এরর (উদাহরণ: `TS18048` in `payment.service.ts`):
  - এগুলো Redis ইন্টিগ্রেশনের সাথে সম্পর্কিত নয়। সংশ্লিষ্ট জায়গায় টাইপ-গার্ড যোগ করে ঠিক করুন।
- ক্যাশ কাজ করছে না:
  - Redis ডাউন হলে NodeCache fallback চলছে কিনা লগে দেখুন।
  - কী-নেমিং ও TTL সঠিকভাবে দেওয়া হয়েছে কিনা চেক করুন।

## প্রোডাকশন টিপস
- সিক্রেট/সেনসিটিভ রেসপন্স ক্যাশ করবেন না।
- অবজারভেবিলিটি: Redis মেট্রিকস/মনিটরিং (কনেকশন, মেমরি) যুক্ত করুন।
- হাই-অ্যাভেইলেবিলিটি: Redis Cluster/Replica বিবেচনা করুন।
- ব্যাকঅফ ও রিট্রাই: Redis কানেকশন এররে সুন্দর ডিগ্রেডেশন রাখুন (fallback সক্রিয়)।

## পরবর্তী ধাপ
- ওয়েবহুক-ইনভ্যালিডেশন ফাইনালাইজ করুন: Payment আপডেট হলে সম্পর্কিত কী ডিলিট করুন।
- আরও রুটে ক্যাশ যোগ করুন যেখানে রিড-হেভি ট্রাফিক আছে।
- ক্যাশ মিস/হিট রেশিও ও TTL টিউন করুন বাস্তব ট্রাফিক দেখে।

---

যে কোনো প্রশ্ন বা সহযোগিতা দরকার হলে জানাবেন — এই গাইডটি ফলো করলে Redis সেটআপ, ব্যবহার ও টেস্ট সহজেই করতে পারবেন।

---

# Redis A–Z: কনসেপ্ট, প্যাটার্ন, প্রোজেক্টে ব্যবহার (সুপার সহজ)

## 1) Redis কী — একদম সহজ ভাষায়
- ইন-মেমরি কী–ভ্যালু ডেটাবেইজ, সুপার ফাস্ট।
- স্টোর করে স্ট্রিং, লিস্ট, সেট, হ্যাশ, সোর্ডেড-সেট ইত্যাদি।
- কী-গুলোতে `TTL` সেট করা যায় — সময় শেষে কী স্বয়ংক্রিয়ভাবে মুছে যায়।
- ক্যাশিং, রেট-লিমিট, কিউ, সেশন—এইসব কাজের জন্য দারুণ।

## 2) দরকারি কনসেপ্ট
- `TTL/EXPIRE`: কত সেকেন্ড পরে কী ডিলিট হবে।
- `Keyspace`: সব কী-এর নেমস্পেস—ভালো নেমিং করলে ম্যানেজ করা সহজ।
- `Pub/Sub`: ম্যাসেজিং—নোটিফাই/ইনভ্যালিডেশন ব্রডকাস্টে কাজে আসে।
- `Persistence (RDB/AOF)`: ক্যাশিং ফোকাসে সাধারণত দরকার নেই, তবু জানা ভালো।

## 3) ক্যাশিং প্যাটার্ন
- Cache-Aside (Lazy Loading):
  - প্রথমে ক্যাশ চেক, না থাকলে সোর্স থেকে ফেচ, ক্যাশে রাখুন, রিটার্ন করুন।
  - আমাদের `CacheHelper.getOrSet` এই প্যাটার্ন।
- Write-Through:
  - লেখার সময়ই ক্যাশ আপডেট—জটিল, কিন্তু কনসিসটেন্ট।
- Read-Through:
  - ক্যাশ লেয়ার নিজে ডেটা ফেচ করে—আমরা মিডলওয়্যার দিয়ে আংশিক করি।

## 4) রেট-লিমিটিং প্যাটার্ন
- Fixed Window (আমরা ব্যবহার করছি): নির্দিষ্ট সময় উইন্ডোতে নির্দিষ্ট সংখ্যা রিকোয়েস্ট।
- Sliding Window: সঠিকতার জন্য রোলিং উইন্ডো ক্যালকুলেশন।
- Token Bucket/Leaky Bucket: আরও স্মার্ট থ্রটলিং।

## 5) এই প্রোজেক্টে কীভাবে জুড়েছে
- `src/config/redis.ts`: ioredis দিয়ে ক্লায়েন্ট তৈরি, ping করে হেলথ চেক।
- `CacheHelper.ts`: রুট ও সার্ভিস লেভেলে ক্যাশিং, TTL সহ।
- `rateLimit.ts`: Redis key কাউন্টার দিয়ে IP/রুট ভিত্তিক সীমা।
- রাউটস: Admin/Payment কিছু `GET` রুটে ক্যাশ, Refund-এ রেট-লিমিট।
- Fallback: Redis না থাকলে NodeCache—সার্ভিস ডাউন না হয়।

## 6) কী-নেমিং — বাস্তব উদাহরণ
- `payment:detail:<paymentId>` → নির্দিষ্ট পেমেন্ট ডিটেইল।
- `payment:history:<userId>` → ইউজারের পেমেন্ট ইতিহাস।
- `dashboard:stats` → অ্যাডমিন স্ট্যাটস।
- `dashboard:revenue:monthly` → মাসিক রেভিনিউ।

## 7) Invalidations — কবে কী মুছবেন
- ওয়েবহুক/আপডেট ইভেন্টে:
  - `payment:detail:<paymentId>`
  - `payment:history:<userId>`
  - যেকোনো অ্যাগ্রিগেট কীগুলো (যদি থাকে)।
- ম্যানুয়াল: `CacheHelper.del(key)` বা ট্যাগ-ভিত্তিক `invalidateTags`।

## 8) আপনার বর্তমান প্রোজেক্টে ধাপে ধাপে ব্যবহার
- Redis চালু করুন (Docker/WSL), `.env` এ `REDIS_URL` দিন।
- `npm install ioredis` দিয়ে প্যাকেজ ইনস্টল।
- রাউট-লেভেল ক্যাশ:
  - Payment/Admin-এর `GET` রুটে `CacheHelper.cacheMiddleware('key', ttl)` যোগ করুন।
- সার্ভিস-লেভেল হট ডেটা:
  - `CacheHelper.getOrSet('key', ttl, async () => fetch())` ব্যবহার করুন।
- রেট-লিমিট:
  - `rateLimitMiddleware({keyPrefix, windowSeconds, maxRequests})` যোগ করুন।
- টেস্ট:
  - প্রথম কল মিস, দ্বিতীয় কল হিট—লগ/সময়ে পার্থক্য দেখুন।

## 9) একদম নতুন (ফ্রেশ) প্রোজেক্টে A–Z সেটআপ
1) প্রোজেক্ট ইনিট:
   - `npm init -y`
   - `npm i express ioredis`
2) Redis ক্লায়েন্ট (`redis.ts`):
```ts
import Redis from 'ioredis';
const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
export default client;
```
3) ক্যাশ হেল্পার (সিম্পল ভার্সন):
```ts
import redis from './redis';
export async function getOrSet(key: string, ttl: number, fn: () => Promise<any>) {
  const v = await redis.get(key);
  if (v) return JSON.parse(v);
  const data = await fn();
  await redis.set(key, JSON.stringify(data), 'EX', ttl);
  return data;
}
```
4) রেট-লিমিট (সিম্পল ফিক্সড উইন্ডো):
```ts
import { Request, Response, NextFunction } from 'express';
import redis from './redis';
export function rateLimit({ keyPrefix, windowSeconds, maxRequests }: { keyPrefix: string; windowSeconds: number; maxRequests: number; }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `${keyPrefix}:${req.ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    if (count > maxRequests) return res.status(429).json({ message: 'Too many requests' });
    next();
  }
}
```
5) রাউট উদাহরণ:
```ts
import express from 'express';
import { getOrSet } from './cache';
import { rateLimit } from './rateLimit';
const app = express();
app.get('/items', async (req, res) => {
  const data = await getOrSet('items:list', 120, async () => fetchFromDB());
  res.json(data);
});
app.post('/refund/:id', rateLimit({ keyPrefix: 'refund', windowSeconds: 900, maxRequests: 5 }), (req, res) => res.json({ ok: true }));
app.listen(3000);
```

## 10) টেস্টিং—CLI দিয়ে চেক করুন
- `redis-cli keys '*'` → কী-গুলো দেখুন (প্রোডাকশনে `KEYS` সতর্কতার সাথে ব্যবহার)।
- `redis-cli ttl <key>` → TTL কত আছে দেখুন।
- `redis-cli get <key>` → ক্যাশড JSON দেখুন।

## 11) সিকিউরিটি ও বেস্ট প্র্যাক্টিস
- সেনসিটিভ/পার্সোনাল ডেটা ক্যাশ করবেন না, করলে ইউজার-স্কোপড কী ব্যবহার করুন।
- Auth header/role ভেদে রেসপন্স ভিন্ন হলে কীতে স্কোপ/রোল যোগ করুন।
- বড় রেসপন্সে কমপ্রেশন (যদি দরকার) বা অংশবিশেষ ক্যাশ করুন।
- TTL কম রাখুন; stale হলে ইনভ্যালিডেশনে ভরসা করুন।

## 12) অবজারভেবিলিটি
- কানেকশন হেলথ (`ping`), ক্যাশ হিট/মিস লগিং যোগ করুন।
- মেমরি ইউসেজ/এভিকশন মনিটর করুন।

## 13) সাধারণ সমস্যা ও সমাধান
- কানেক্ট করতে পারছে না: URL ঠিক করুন, সার্ভিস চালু আছে কিনা দেখুন।
- 429 বারবার: রেট-লিমিট কনফিগ সময়/কাউন্ট টিউন করুন।
- বিল্ড টাইপ এরর: `payment.service.ts`-এ টাইপ-গার্ড দিন (Redis-নিরপেক্ষ)।

এই অংশগুলো ফলো করলে আপনি ধারণা থেকে ইমপ্লিমেন্টেশন—সবকিছু সহজে করতে পারবেন।