// Test real payment flow with webhook monitoring
const LIVE_SERVER_URL = 'https://nayem5001.binarybards.online';
const API_BASE = `${LIVE_SERVER_URL}/api/v1`;

// Test configuration - you need to update these with real values
const TEST_CONFIG = {
  // Get these from your actual system
  email: 'test@example.com',
  password: 'your_password',
  taskId: 'your_task_id',
  bidAmount: 50
};

async function testRealPaymentFlow() {
  console.log('🚀 Testing Real Payment Flow with Webhook Monitoring');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Login to get auth token
    console.log('1️⃣ Logging in to get auth token...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_CONFIG.email,
        password: TEST_CONFIG.password
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed. Please update TEST_CONFIG with valid credentials');
      console.log('📝 To test manually:');
      console.log('   1. Update TEST_CONFIG in this file with real values');
      console.log('   2. Or use Postman to test the flow');
      return;
    }
    
    const loginData = await loginResponse.json();
    const authToken = loginData.data.accessToken;
    console.log('✅ Login successful');
    
    // Step 2: Create a bid
    console.log('\n2️⃣ Creating a test bid...');
    const bidResponse = await fetch(`${API_BASE}/bids`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        taskId: TEST_CONFIG.taskId,
        amount: TEST_CONFIG.bidAmount,
        description: 'Test bid for webhook monitoring'
      })
    });
    
    if (!bidResponse.ok) {
      console.log('❌ Bid creation failed. Please check taskId in TEST_CONFIG');
      return;
    }
    
    const bidData = await bidResponse.json();
    const bidId = bidData.data.id;
    console.log('✅ Bid created:', bidId);
    
    // Step 3: Accept the bid
    console.log('\n3️⃣ Accepting the bid...');
    const acceptResponse = await fetch(`${API_BASE}/bids/${bidId}/accept`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!acceptResponse.ok) {
      console.log('❌ Bid acceptance failed');
      return;
    }
    
    const acceptData = await acceptResponse.json();
    const { clientSecret, paymentIntentId } = acceptData.data;
    console.log('✅ Bid accepted, payment created:', {
      paymentIntentId,
      clientSecret: clientSecret.substring(0, 30) + '...'
    });
    
    // Step 4: Instructions for payment completion
    console.log('\n4️⃣ Payment completion instructions:');
    console.log('📝 To complete the payment:');
    console.log(`   1. Open stripe-payment-test.html in browser`);
    console.log(`   2. Enter client secret: ${clientSecret}`);
    console.log(`   3. Use test card: 4242 4242 4242 4242`);
    console.log(`   4. Complete the payment`);
    console.log('');
    console.log('🔍 Monitor your server logs for these messages:');
    console.log('   🔔 WEBHOOK RECEIVED: (webhook incoming)');
    console.log('   ✅ Webhook signature verified successfully');
    console.log('   📨 Received webhook event: payment_intent.succeeded');
    console.log('   💰 Processing payment succeeded');
    console.log('   ✅ Successfully processed payment_intent.succeeded');
    
    // Step 5: Monitor payment status
    console.log('\n5️⃣ Monitoring payment status...');
    console.log('⏳ Waiting for payment completion and webhook processing...');
    
    let attempts = 0;
    const maxAttempts = 20; // 2 minutes total
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds
      attempts++;
      
      try {
        const statusResponse = await fetch(`${API_BASE}/payments/status/${paymentIntentId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`📊 Payment status check ${attempts}:`, {
            status: statusData.data.status,
            stripeStatus: statusData.data.stripeStatus
          });
          
          if (statusData.data.status === 'held') {
            console.log('🎉 SUCCESS! Payment captured via webhook!');
            console.log('✅ Webhook system is working correctly');
            return;
          }
          
          if (statusData.data.stripeStatus === 'succeeded' && statusData.data.status !== 'held') {
            console.log('⚠️  Payment succeeded in Stripe but not captured in database');
            console.log('   This indicates webhook processing issue');
          }
        }
      } catch (error) {
        console.log(`❌ Error checking payment status: ${error.message}`);
      }
      
      if (attempts === 5) {
        console.log('⏰ 30 seconds passed - automatic capture should trigger soon...');
      }
      
      if (attempts === 10) {
        console.log('⏰ 1 minute passed - checking if automatic capture worked...');
      }
    }
    
    console.log('⏰ Monitoring timeout reached');
    console.log('');
    console.log('🔍 If payment is still not captured:');
    console.log('   1. Check server logs for webhook calls');
    console.log('   2. Verify Stripe Dashboard webhook configuration');
    console.log('   3. Check if webhook secret matches .env file');
    console.log('   4. Ensure webhook endpoint is accessible from internet');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Instructions for manual testing
console.log('📋 MANUAL TESTING INSTRUCTIONS:');
console.log('');
console.log('Since this requires real credentials, you can test manually:');
console.log('');
console.log('1. Use Postman to accept a bid');
console.log('2. Use stripe-payment-test.html to complete payment');
console.log('3. Monitor server logs for webhook processing');
console.log('4. Check payment status in database');
console.log('');
console.log('Expected webhook logs sequence:');
console.log('🔔 WEBHOOK RECEIVED → ✅ Signature verified → 📨 Event received → 💰 Payment processed → ✅ Success');
console.log('');

// Uncomment to run with real credentials
// testRealPaymentFlow().catch(console.error);