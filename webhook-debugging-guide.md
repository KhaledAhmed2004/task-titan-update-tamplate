# 🔧 Webhook Debugging Guide

## Current Issue
Payments are not being automatically captured through webhooks, requiring manual intervention.

## ✅ What We've Implemented

### 1. Enhanced Logging
- Added detailed webhook logging in `webhook.controller.ts`
- Logs show webhook receipt, signature verification, and event processing
- Look for these log patterns in your server:

```
🔔 WEBHOOK RECEIVED: (incoming webhook details)
✅ Webhook signature verified successfully
📨 Received webhook event: (event type and details)
💰 Processing payment succeeded: (payment details)
✅ Successfully processed payment_intent.succeeded
```

### 2. Automatic Capture Fallback
- Added 30-second automatic capture in `payment.service.ts`
- Triggers if webhook fails to process payment
- Updates payment status to `HELD` and bid status to `ACCEPTED`

## 🔍 Debugging Steps

### Step 1: Check Stripe Dashboard Configuration
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Find your webhook endpoint: `https://nayem5001.binarybards.online/api/v1/payments/webhook`
3. Verify these events are enabled:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed` 
   - `payment_intent.canceled`
4. Copy the webhook signing secret (starts with `whsec_`)
5. Verify it matches your `.env` file `STRIPE_WEBHOOK_SECRET`

### Step 2: Test Webhook Endpoint
```bash
# Test webhook health
curl https://nayem5001.binarybards.online/api/v1/payments/webhook/health

# Should return:
# {"status":"healthy","timestamp":"...","webhook_endpoint":"/api/payment/webhook"}
```

### Step 3: Monitor Server Logs
1. **Start your server** and monitor logs
2. **Accept a bid** in Postman
3. **Complete payment** using `stripe-payment-test.html`
4. **Watch for webhook logs** in your server console

### Step 4: Expected Log Sequence
```
🔔 WEBHOOK RECEIVED: {timestamp, headers, bodySize}
🔐 Webhook secret configured: whsec_...
✅ Webhook signature verified successfully
📨 Received webhook event: {type: "payment_intent.succeeded", id, created}
💰 Processing payment succeeded: {paymentIntentId, amount, status, metadata}
🎯 Processing payment for bid: [bidId]
✅ Successfully processed payment_intent.succeeded for bid: [bidId]
```

## 🚨 Common Issues & Solutions

### Issue 1: No Webhook Logs Appear
**Problem**: Stripe webhooks not reaching your server
**Solutions**:
- Verify webhook URL in Stripe Dashboard
- Check if server is accessible from internet
- Ensure no firewall blocking webhook calls
- Test webhook endpoint accessibility

### Issue 2: Signature Verification Fails
**Problem**: `❌ Webhook signature verification failed`
**Solutions**:
- Check webhook secret in `.env` file
- Ensure webhook secret matches Stripe Dashboard
- Verify webhook endpoint URL is correct
- Check if webhook secret starts with `whsec_`

### Issue 3: No bid_id in Metadata
**Problem**: `❌ No bid_id found in payment intent metadata`
**Solutions**:
- Check payment creation in `payment.service.ts`
- Ensure `bid_id` is added to payment intent metadata
- Verify bid acceptance process includes metadata

### Issue 4: Payment Succeeded but Not Captured
**Problem**: Payment shows `succeeded` in Stripe but `pending` in database
**Solutions**:
- Check webhook event processing
- Verify `PaymentService.handleWebhookEvent` is called
- Check database update logic in payment service

## 🧪 Testing Process

### Manual Testing Steps:
1. **Accept a bid** using Postman
2. **Complete payment** using test card in `stripe-payment-test.html`
3. **Monitor server logs** for webhook processing
4. **Check payment status** in database after 30-40 seconds

### Expected Results:
- ✅ Webhook logs appear in server console
- ✅ Payment status changes to `HELD`
- ✅ Bid status changes to `ACCEPTED`
- ✅ No manual intervention required

## 🔧 Quick Fixes

### If Webhooks Still Don't Work:
1. **Check Stripe Dashboard** webhook configuration
2. **Verify webhook secret** in `.env` file
3. **Test webhook endpoint** accessibility
4. **Monitor server logs** during payment

### Temporary Solution:
- Automatic capture fallback will trigger after 30 seconds
- Payment will be captured even if webhook fails
- This ensures no payments remain uncaptured

## 📞 Next Steps

1. **Test the current implementation** with a real payment
2. **Monitor server logs** to identify specific issues
3. **Check Stripe Dashboard** for webhook delivery attempts
4. **Verify webhook configuration** matches your server setup

The enhanced logging will help identify exactly where the webhook processing is failing, allowing for targeted fixes.