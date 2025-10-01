// Test webhook with proper Stripe signature generation
require('dotenv').config();

async function testWebhookWithStripeSignature() {
  console.log('🔧 Testing Webhook with Proper Stripe Signature');
  console.log('=' .repeat(60));
  
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not found in .env');
      return;
    }
    
    console.log('✅ Stripe configured');
    console.log('✅ Webhook secret found:', webhookSecret.substring(0, 10) + '...');
    
    // Create a realistic test payload
    const testPayload = {
      id: 'evt_test_webhook_real',
      object: 'event',
      api_version: '2020-08-27',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_test_payment_intent_real',
          object: 'payment_intent',
          amount: 5000,
          currency: 'usd',
          status: 'succeeded',
          capture_method: 'manual',
          metadata: {
            bid_id: '68dd4e0cce899fda10e2c18a', // Use the actual bid ID from your test
            poster_id: 'test_poster_id',
            tasker_id: 'test_tasker_id'
          },
          charges: {
            data: [
              {
                id: 'ch_test_charge',
                transfer: null
              }
            ]
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_webhook',
        idempotency_key: null
      },
      type: 'payment_intent.succeeded'
    };

    const payload = JSON.stringify(testPayload);
    const timestamp = Math.floor(Date.now() / 1000);
    
    console.log('📝 Test payload created:', {
      size: payload.length,
      type: testPayload.type,
      bidId: testPayload.data.object.metadata.bid_id,
      paymentIntentId: testPayload.data.object.id
    });

    // Generate proper Stripe signature
    const testSignature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
      timestamp
    });

    console.log('🔐 Generated test signature:', testSignature.substring(0, 50) + '...');

    // Test with the live server
    const WEBHOOK_ENDPOINT = 'https://nayem5001.binarybards.online/api/v1/payments/webhook';
    
    console.log('\n🧪 Testing webhook endpoint:', WEBHOOK_ENDPOINT);
    
    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': testSignature
      },
      body: payload
    });

    console.log('\n📊 Response Details:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);

    if (response.status === 200) {
      console.log('\n✅ SUCCESS! Webhook processed successfully');
      console.log('🎯 This means:');
      console.log('   - Raw body parsing is working');
      console.log('   - Signature verification is working');
      console.log('   - Webhook handler is processing events');
      console.log('   - Payment should be captured automatically');
    } else if (response.status === 400) {
      console.log('\n⚠️  Webhook rejected (400)');
      if (responseText.includes('signature')) {
        console.log('❌ Signature verification still failing');
        console.log('💡 Check if webhook secret matches Stripe Dashboard');
      } else {
        console.log('❌ Other validation error:', responseText);
      }
    } else {
      console.log('\n❌ Unexpected response status');
      console.log('🔍 Check server logs for more details');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('stripe')) {
      console.log('💡 Install stripe package: npm install stripe');
    }
  }

  console.log('\n📋 Next Steps:');
  console.log('1. If test succeeds: Try real payment flow');
  console.log('2. If test fails: Check server logs for webhook errors');
  console.log('3. Monitor server console for webhook processing logs');
  console.log('4. Verify Stripe Dashboard webhook configuration');
  
  console.log('\n🔍 Expected Server Logs (if working):');
  console.log('🔔 WEBHOOK RECEIVED: {timestamp, headers, bodySize}');
  console.log('🔐 Webhook secret configured: whsec_...');
  console.log('✅ Webhook signature verified successfully');
  console.log('📨 Received webhook event: payment_intent.succeeded');
  console.log('💰 Processing payment succeeded');
  console.log('✅ Successfully processed payment_intent.succeeded');
}

// Run the test
testWebhookWithStripeSignature().catch(console.error);