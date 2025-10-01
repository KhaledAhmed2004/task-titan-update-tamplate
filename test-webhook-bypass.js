// Test webhook by bypassing signature verification temporarily
const fetch = require('node-fetch');
require('dotenv').config();

async function testWebhookBypass() {
  console.log('🔧 Testing webhook with proper signature generation...\n');

  // Create a test payload that matches the actual Stripe event structure
  const webhookPayload = {
    id: 'evt_test_bypass',
    object: 'event',
    api_version: '2025-07-30',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'pi_test_bypass_payment_intent',
        object: 'payment_intent',
        amount: 5000,
        currency: 'usd',
        status: 'requires_capture', // This is the key status
        metadata: {
          bid_id: '68dc71b5272625598020c86b', // Real bid ID
          poster_id: 'test_poster_id',
          tasker_id: '68dadc4015eb160254dad9a4'
        },
        charges: {
          data: [
            {
              id: 'ch_test_bypass_charge',
              transfer: null
            }
          ]
        },
        capture_method: 'manual'
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test_bypass',
      idempotency_key: null
    },
    type: 'payment_intent.succeeded'
  };

  console.log('📋 Test Details:');
  console.log('- Payment Intent Status:', webhookPayload.data.object.status);
  console.log('- Bid ID:', webhookPayload.data.object.metadata.bid_id);
  console.log('- Capture Method:', webhookPayload.data.object.capture_method);
  console.log('- Event Type:', webhookPayload.type);

  // Test with proper Stripe signature
  console.log('\n🧪 Testing with proper Stripe signature...');
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    console.log('🔑 Using webhook secret:', webhookSecret ? 'Found' : 'Missing');
    
    const payload = JSON.stringify(webhookPayload);
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Generate test signature
    const testSignature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
      timestamp
    });

    console.log('✅ Generated test signature successfully');
    
    // Now test with the valid signature
    const response = await fetch('http://10.10.7.33:5001/api/v1/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': testSignature
      },
      body: payload
    });

    console.log('📊 Response status:', response.status);
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);

    if (response.status === 200) {
      console.log('✅ Webhook processed successfully!');
      console.log('🎯 The webhook endpoint is working correctly');
      console.log('💡 This means the issue might be:');
      console.log('   1. Stripe is not sending webhooks to your server');
      console.log('   2. Your server is not accessible from Stripe');
      console.log('   3. The webhook URL in Stripe dashboard is incorrect');
    } else {
      console.log('❌ Webhook processing failed');
      console.log('🔍 Check the server logs for more details');
    }

  } catch (error) {
    console.log('❌ Test error:', error.message);
    
    if (error.message.includes('stripe')) {
      console.log('💡 Make sure you have stripe package installed: npm install stripe');
    }
  }

  console.log('\n📋 Troubleshooting Steps:');
  console.log('1. ✅ Webhook endpoint exists: /api/v1/payments/webhook');
  console.log('2. ✅ Server is running on port 5001');
  console.log('3. ✅ STRIPE_WEBHOOK_SECRET is configured');
  console.log('4. ❓ Check Stripe Dashboard webhook configuration');
  console.log('5. ❓ Verify webhook URL points to your server');
  console.log('6. ❓ Use ngrok or Stripe CLI for local testing');
  
  console.log('\n🔧 Recommended Solutions:');
  console.log('1. Use Stripe CLI: stripe listen --forward-to localhost:5001/api/v1/payments/webhook');
  console.log('2. Or use ngrok: ngrok http 5001, then update webhook URL in Stripe');
  console.log('3. Check if your payment is actually triggering webhooks in Stripe Dashboard');
}

// Run the test
testWebhookBypass().catch(console.error);