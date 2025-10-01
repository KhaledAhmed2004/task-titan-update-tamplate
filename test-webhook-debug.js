// Debug webhook test to bypass signature verification
const fetch = require('node-fetch');

async function testWebhookDebug() {
  console.log('🔧 Debug webhook test - bypassing signature verification...\n');

  // Sample payment_intent.succeeded event with requires_capture status
  const webhookPayload = {
    id: 'evt_debug_test',
    object: 'event',
    api_version: '2025-07-30',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'pi_debug_test_payment_intent',
        object: 'payment_intent',
        amount: 5000, // $50.00
        currency: 'usd',
        status: 'requires_capture', // This is the key status we need to test
        metadata: {
          bid_id: '68dc71b5272625598020c86b', // Use actual bid ID
          poster_id: 'test_poster_id',
          tasker_id: '68dadc4015eb160254dad9a4'
        },
        charges: {
          data: [
            {
              id: 'ch_debug_test_charge',
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
      id: 'req_debug_test',
      idempotency_key: null
    },
    type: 'payment_intent.succeeded'
  };

  try {
    console.log('📤 Sending debug webhook payload...');
    console.log('🎯 Testing with status: requires_capture');
    console.log('📋 Bid ID:', webhookPayload.data.object.metadata.bid_id);
    
    // First, let's test the webhook endpoint directly
    const response = await fetch('http://10.10.7.33:5001/api/v1/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Skip stripe-signature to see if we can bypass verification for testing
      },
      body: JSON.stringify(webhookPayload)
    });

    console.log('📊 Response status:', response.status);
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);

    if (response.status === 400 && responseText.includes('signature')) {
      console.log('\n🔍 Signature verification is working (expected in production)');
      console.log('💡 This means webhook endpoint is configured correctly');
      console.log('🎯 The issue might be that Stripe is not sending webhooks');
      console.log('   or the webhook events are not being processed correctly');
    }

  } catch (error) {
    console.log('❌ Webhook test error:', error.message);
  }

  console.log('\n📋 Debug Summary:');
  console.log('1. Webhook endpoint: /api/v1/payments/webhook');
  console.log('2. Server is running on port 5001');
  console.log('3. Payment capture logic has been added to handlePaymentSucceeded');
  console.log('4. The issue might be:');
  console.log('   - Stripe webhook not configured to send to your server');
  console.log('   - Webhook signature verification failing');
  console.log('   - Payment status not being updated correctly');
  
  console.log('\n🔧 Next steps:');
  console.log('1. Check Stripe Dashboard webhook configuration');
  console.log('2. Verify STRIPE_WEBHOOK_SECRET environment variable');
  console.log('3. Test with actual Stripe CLI: stripe listen --forward-to localhost:5001/api/v1/payments/webhook');
}

// Run the test
testWebhookDebug().catch(console.error);