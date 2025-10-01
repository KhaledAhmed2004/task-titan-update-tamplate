// Test webhook signature verification with live server
const crypto = require('crypto');

// Live server configuration
const LIVE_SERVER_URL = 'https://nayem5001.binarybards.online';
const WEBHOOK_ENDPOINT = `${LIVE_SERVER_URL}/api/v1/payments/webhook`;

// Test webhook signature verification
async function testWebhookSignature() {
  console.log('🔐 Testing Webhook Signature Verification');
  console.log('=' .repeat(50));
  
  // Create a test payload (similar to what Stripe sends)
  const testPayload = JSON.stringify({
    id: 'evt_test_webhook',
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'pi_test_payment_intent',
        object: 'payment_intent',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          bid_id: 'test_bid_123'
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
  });

  console.log('📝 Test payload created:', {
    size: testPayload.length,
    type: 'payment_intent.succeeded'
  });

  // Test 1: Send without signature (should fail)
  console.log('\n1️⃣ Testing without signature (should fail)...');
  try {
    const response1 = await fetch(WEBHOOK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: testPayload
    });
    
    const result1 = await response1.text();
    console.log('Response status:', response1.status);
    console.log('Response:', result1);
    
    if (response1.status === 400) {
      console.log('✅ Correctly rejected request without signature');
    } else {
      console.log('⚠️  Unexpected response for request without signature');
    }
  } catch (error) {
    console.error('❌ Error testing without signature:', error.message);
  }

  // Test 2: Send with invalid signature (should fail)
  console.log('\n2️⃣ Testing with invalid signature (should fail)...');
  try {
    const response2 = await fetch(WEBHOOK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=1234567890,v1=invalid_signature'
      },
      body: testPayload
    });
    
    const result2 = await response2.text();
    console.log('Response status:', response2.status);
    console.log('Response:', result2);
    
    if (response2.status === 400) {
      console.log('✅ Correctly rejected request with invalid signature');
    } else {
      console.log('⚠️  Unexpected response for request with invalid signature');
    }
  } catch (error) {
    console.error('❌ Error testing with invalid signature:', error.message);
  }

  // Test 3: Check if webhook secret is properly configured
  console.log('\n3️⃣ Checking webhook secret configuration...');
  console.log('📋 Instructions to verify webhook configuration:');
  console.log('');
  console.log('1. Go to Stripe Dashboard → Developers → Webhooks');
  console.log('2. Find your webhook endpoint:', WEBHOOK_ENDPOINT);
  console.log('3. Check if these events are enabled:');
  console.log('   - payment_intent.succeeded');
  console.log('   - payment_intent.payment_failed');
  console.log('   - payment_intent.canceled');
  console.log('4. Copy the webhook signing secret (starts with whsec_)');
  console.log('5. Verify it matches your .env STRIPE_WEBHOOK_SECRET');
  console.log('');
  console.log('🔍 Common issues:');
  console.log('   - Webhook endpoint URL mismatch');
  console.log('   - Wrong webhook secret in .env');
  console.log('   - Missing required events');
  console.log('   - Webhook endpoint not accessible from Stripe');

  // Test 4: Check server logs
  console.log('\n4️⃣ Next steps for debugging:');
  console.log('');
  console.log('1. Check your server logs for webhook calls');
  console.log('2. Look for these log messages:');
  console.log('   🔔 WEBHOOK RECEIVED: (incoming webhook)');
  console.log('   ✅ Webhook signature verified successfully');
  console.log('   📨 Received webhook event: (event processing)');
  console.log('   💰 Processing payment succeeded: (payment handling)');
  console.log('');
  console.log('3. If no logs appear, webhook is not reaching your server');
  console.log('4. If signature verification fails, check webhook secret');
  console.log('5. If payment processing fails, check bid_id in metadata');
}

// Run the test
testWebhookSignature().catch(console.error);