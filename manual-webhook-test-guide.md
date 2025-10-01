# 🔧 Manual Webhook Test Guide

## যদি login credentials না থাকে:

### Option 1: Postman দিয়ে Test করুন

1. **Postman Collection import করুন:**
   ```
   postman-collections/auth-collection.json
   ```

2. **Login করে auth token নিন**

3. **Bid create ও accept করুন**

4. **Payment create করুন**

5. **Client secret দিয়ে stripe-payment-test.html এ payment complete করুন**

### Option 2: Direct Client Secret Test

যদি আপনার কাছে existing client secret থাকে:

1. **stripe-payment-test.html খুলুন**
2. **Client secret paste করুন**
3. **Test card: 4242424242424242**
4. **Payment complete করুন**
5. **Server logs দেখুন**

### Expected Server Logs:
```
🔔 WEBHOOK RECEIVED: {timestamp, headers, bodySize}
🔐 Webhook secret configured: whsec_...
✅ Webhook signature verified successfully
📨 Received webhook event: payment_intent.succeeded
💰 Processing payment succeeded
✅ Successfully processed payment_intent.succeeded
```

### যদি Webhook কাজ না করে:

#### Check করুন:

1. **Stripe Dashboard:**
   - Webhook URL: https://nayem5001.binarybards.online/api/v1/payments/webhook
   - Events selected: payment_intent.succeeded
   - Webhook secret matches .env

2. **Server Status:**
   - Server running এবং accessible
   - Database connected
   - No middleware errors

3. **Network:**
   - Server publicly accessible
   - Firewall allowing Stripe webhooks
   - SSL certificate valid

## 🎯 Key Points:

- **Webhook automatically কাজ করে** - manual API call লাগে না
- **Stripe server থেকে webhook আসে** - আপনার server এ
- **Payment complete করলেই webhook trigger হয়**
- **Server logs এ webhook messages দেখতে পাবেন**

## 🔍 Debugging Steps:

1. **Server logs monitor করুন**
2. **Stripe Dashboard এ webhook events check করুন**
3. **Payment status database এ check করুন**
4. **Network connectivity verify করুন**