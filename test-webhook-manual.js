// Manual webhook test to simulate payment_intent.succeeded event
async function testWebhookManually() {
  console.log('🧪 Testing webhook manually...\n');

  // Sample payment_intent.succeeded event payload
  const webhookPayload = {
    id: 'evt_test_webhook',
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'pi_test_payment_intent',
        object: 'payment_intent',
        amount: 5000, // $50.00
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          bid_id: '68dc71b5272625598020c86b', // Real bid ID with payment_pending status
          poster_id: 'test_poster_id',
          tasker_id: '68dadc4015eb160254dad9a4'
        },
        charges: {
          data: [
            {
              id: 'ch_test_charge',
              transfer: 'tr_test_transfer'
            }
          ]
        }
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test_request',
      idempotency_key: null
    },
    type: 'payment_intent.succeeded'
  };

  try {
    console.log('📤 Sending webhook payload to local server...');
    console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
    
    const response = await fetch('http://10.10.7.33:5001/api/v1/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature' // This will fail signature verification but we can see the flow
      },
      body: JSON.stringify(webhookPayload)
    });

    const responseData = await response.text();
    console.log('✅ Webhook response:', response.status, responseData);
  } catch (error) {
    console.log('❌ Webhook error:', error.message);
    
    if (error.message.includes('signature')) {
      console.log('\n🔍 This is expected - signature verification failed in development');
      console.log('The webhook endpoint is working but requires valid Stripe signature');
    }
  }

  console.log('\n📋 Next steps:');
  console.log('1. Check if you have a valid bid with payment_pending status');
  console.log('2. Update the bid_id in this script with actual bid ID');
  console.log('3. Use Stripe CLI for proper webhook testing: stripe listen --forward-to localhost:5001/api/v1/payments/webhook');
  console.log('4. Or use ngrok to expose your local server to Stripe webhooks');
}

// Test the webhook endpoint health first
async function testWebhookHealth() {
  try {
    console.log('🏥 Testing webhook health endpoint...');
    const response = await fetch('http://10.10.7.33:5001/api/v1/payments/webhook/health');
    const data = await response.json();
    console.log('✅ Webhook health check passed:', data);
    return true;
  } catch (error) {
    console.log('❌ Webhook health check failed:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting webhook tests...\n');
  
  const healthCheck = await testWebhookHealth();
  if (!healthCheck) {
    console.log('❌ Server is not running or webhook endpoint is not accessible');
    console.log('Please make sure your server is running on port 5001');
    return;
  }

  console.log('\n' + '='.repeat(50));
  await testWebhookManually();
}

// Run the tests
runTests().catch(console.error);