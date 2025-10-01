# 🔄 Stripe Webhook Flow বুঝুন

## কিভাবে Webhook কাজ করে:

### ✅ সঠিক Flow:
```
1. stripe-payment-test.html → Payment Complete
2. Stripe Server → Automatically sends webhook to your server
3. Your Server → Receives webhook → Captures payment
4. Database → Payment status: PENDING → HELD
```

### ❌ আপনাকে যা করতে হবে না:
- Manual API call webhook endpoint এ
- Manual payment capture
- Manual database update

## 🔍 সমস্যা কেন হতে পারে:

### 1. **Stripe Dashboard Configuration**
```
❌ Webhook URL ভুল হতে পারে
❌ Events select করা নেই
❌ Webhook secret match করছে না
```

### 2. **Server Issues**
```
❌ Server restart হয়নি
❌ Webhook endpoint accessible না
❌ Environment variables ভুল
```

### 3. **Payment Flow Issues**
```
❌ Client secret ভুল
❌ Payment intent create হয়নি
❌ Bid accept করা নেই
```

## 🧪 Test করার সঠিক পদ্ধতি:

### Step 1: Server Logs Monitor করুন
```bash
# Terminal এ দেখুন:
🔔 WEBHOOK RECEIVED: {timestamp, headers, bodySize}
✅ Webhook signature verified successfully
📨 Received webhook event: payment_intent.succeeded
💰 Processing payment succeeded
```

### Step 2: Payment Complete করুন
```
1. stripe-payment-test.html খুলুন
2. Client secret দিন
3. Test card: 4242424242424242
4. Payment complete করুন
```

### Step 3: Results Check করুন
```
✅ Server logs এ webhook messages
✅ Database এ payment status: HELD
✅ Stripe Dashboard এ payment captured
```

## 🔧 যদি কাজ না করে:

### Check করুন:
1. **Stripe Dashboard:**
   - Webhook URL: https://nayem5001.binarybards.online/api/v1/payments/webhook
   - Events: payment_intent.succeeded
   - Webhook secret matches .env

2. **Server Status:**
   - Server running on port 5001
   - Database connected
   - No errors in logs

3. **Payment Status:**
   - Bid status: ACCEPTED
   - Payment intent created
   - Client secret valid

## 💡 মনে রাখুন:
- Webhook **automatically** কাজ করে
- আপনাকে **manual API call** করতে হবে না
- শুধু payment complete করলেই webhook trigger হবে