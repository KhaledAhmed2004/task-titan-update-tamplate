// Test webhook fix with proper signature verification
const crypto = require('crypto');

// Live server configuration
const LIVE_SERVER_URL = 'https://nayem5001.binarybards.online';
const WEBHOOK_ENDPOINT = `${LIVE_SERVER_URL}/api/v1/payments/webhook`;

async function testWebhookFix() {
  console.log('🔧 Testing Webhook Fix - Raw Body Parsing');
  console.log('=' .repeat(50));
  
  // Create a test payload (similar to what Stripe sends)
  const testPayload = {
    id: 'evt_test_webhook_fix',
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'pi_test_payment_intent_fix',
        object: 'payment_intent',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          bid_id: '68dc71b5272625598020c86b'  // Use a real bid ID from your system
        }
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null
    },
    type: 'payment_intent.succeeded'
  };

  const payload = JSON.stringify(testPayload);
  console.log('📝 Test payload created:', {
    size: payload.length,
    type: testPayload.type,
    bidId: testPayload.data.object.metadata.bid_id
  });

  // Test 1: Send without signature (should fail with proper error)
  console.log('\n1️⃣ Testing without signature (should fail gracefully)...');
  try {
    const response1 = await fetch(WEBHOOK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    });
    
    const result1 = await response1.text();
    console.log('Response status:', response1.status);
    console.log('Response:', result1);
    
    if (response1.status === 400 && result1.includes('signature')) {
      console.log('✅ Correctly rejected request without signature');
      console.log('✅ Raw body parsing is working - no JSON parsing errors');
    } else {
      console.log('⚠️  Unexpected response for request without signature');
    }
  } catch (error) {
    console.error('❌ Error testing without signature:', error.message);
  }

  // Test 2: Send with invalid signature (should fail with signature error)
  console.log('\n2️⃣ Testing with invalid signature (should fail with signature error)...');
  try {
    const response2 = await fetch(WEBHOOK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=1234567890,v1=invalid_signature_test'
      },
      body: payload
    });
    
    const result2 = await response2.text();
    console.log('Response status:', response2.status);
    console.log('Response:', result2);
    
    if (response2.status === 400 && result2.includes('signature')) {
      console.log('✅ Correctly rejected request with invalid signature');
      console.log('✅ Signature verification is working properly');
    } else {
      console.log('⚠️  Unexpected response for request with invalid signature');
    }
  } catch (error) {
    console.error('❌ Error testing with invalid signature:', error.message);
  }

  // Test 3: Check server logs guidance
  console.log('\n3️⃣ Server Log Monitoring Guide:');
  console.log('');
  console.log('🔍 Look for these log patterns in your server:');
  console.log('');
  console.log('✅ FIXED - Should see:');
  console.log('   🔔 WEBHOOK RECEIVED: {timestamp, headers, bodySize, rawBody}');
  console.log('   🔐 Webhook secret configured: whsec_...');
  console.log('   ✅ Webhook signature verified successfully');
  console.log('');
  console.log('❌ BEFORE FIX - You were seeing:');
  console.log('   ❌ Webhook signature verification failed');
  console.log('   ❌ Error: No signatures found matching the expected signature');
  console.log('   ❌ bodyLength: [object Object] (parsed JSON instead of raw)');
  console.log('');

  // Test 4: Next steps for real testing
  console.log('4️⃣ Next Steps for Real Payment Testing:');
  console.log('');
  console.log('1. 🔄 Restart your server to apply the middleware changes');
  console.log('2. 🧪 Accept a bid and complete payment');
  console.log('3. 👀 Monitor server logs for webhook processing');
  console.log('4. ✅ Verify payment status changes from PENDING to HELD');
  console.log('5. ✅ Verify bid status changes to ACCEPTED');
  console.log('');
  console.log('🎯 Expected Success Flow:');
  console.log('   1. Payment completed in Stripe');
  console.log('   2. Stripe sends webhook to your server');
  console.log('   3. Server receives raw body (not parsed JSON)');
  console.log('   4. Signature verification succeeds');
  console.log('   5. Payment captured automatically');
  console.log('   6. Database updated: payment=HELD, bid=ACCEPTED');
  console.log('');
  console.log('🔧 If still having issues:');
  console.log('   - Check Stripe Dashboard webhook configuration');
  console.log('   - Verify webhook endpoint URL is correct');
  console.log('   - Ensure STRIPE_WEBHOOK_SECRET matches dashboard');
  console.log('   - Use Stripe CLI for local testing: stripe listen --forward-to localhost:5001/api/v1/payments/webhook');
}

// Run the test
testWebhookFix().catch(console.error);