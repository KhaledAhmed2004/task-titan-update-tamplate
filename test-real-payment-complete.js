// Complete real payment flow test
const LIVE_SERVER_URL = 'https://nayem5001.binarybards.online';
const API_BASE = `${LIVE_SERVER_URL}/api/v1`;

// Test configuration - update with your actual values
const TEST_CONFIG = {
  email: 'test@example.com',
  password: 'your_password',
  taskId: '68dd4e06ce899fda10e2c186', // From your recent test
  bidId: '68dd4e0cce899fda10e2c18a'   // From your recent test
};

async function testCompletePaymentFlow() {
  console.log('🧪 Testing Complete Payment Flow with Webhook');
  console.log('=' .repeat(60));
  
  let authToken = '';
  
  try {
    // Step 1: Login to get auth token
    console.log('\n1️⃣ Logging in...');
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
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      authToken = loginData.data.accessToken;
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed - using manual auth token');
      console.log('💡 Please update TEST_CONFIG with valid credentials');
      return;
    }

    // Step 2: Check current bid status
    console.log('\n2️⃣ Checking current bid status...');
    const bidResponse = await fetch(`${API_BASE}/bids/${TEST_CONFIG.bidId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (bidResponse.ok) {
      const bidData = await bidResponse.json();
      console.log('📊 Current bid status:', bidData.data.status);
      console.log('📊 Bid amount:', bidData.data.amount);
      
      if (bidData.data.status !== 'ACCEPTED') {
        console.log('⚠️  Bid is not in ACCEPTED status');
        console.log('💡 Please accept the bid first before testing payment');
        return;
      }
    } else {
      console.log('❌ Failed to fetch bid details');
      return;
    }

    // Step 3: Check if payment already exists
    console.log('\n3️⃣ Checking payment status...');
    const paymentResponse = await fetch(`${API_BASE}/payments/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (paymentResponse.ok) {
      const paymentData = await paymentResponse.json();
      const bidPayment = paymentData.data.find(p => p.bidId === TEST_CONFIG.bidId);
      
      if (bidPayment) {
        console.log('💰 Payment found:', {
          id: bidPayment._id,
          status: bidPayment.status,
          amount: bidPayment.amount,
          paymentIntentId: bidPayment.paymentIntentId
        });
        
        if (bidPayment.status === 'HELD') {
          console.log('✅ Payment is already captured!');
          console.log('🎯 Webhook is working correctly');
          return;
        } else if (bidPayment.status === 'PENDING') {
          console.log('⏳ Payment is still pending');
          console.log('🔍 This suggests webhook is not capturing the payment');
          
          // Check Stripe payment intent status
          console.log('\n4️⃣ Checking Stripe payment intent status...');
          console.log('💡 You need to complete the payment in Stripe first');
          console.log('📋 Steps to complete payment:');
          console.log('   1. Open stripe-payment-test.html in browser');
          console.log('   2. Use client secret from payment creation');
          console.log('   3. Complete payment with test card: 4242424242424242');
          console.log('   4. Monitor server logs for webhook processing');
          
          return;
        }
      } else {
        console.log('❌ No payment found for this bid');
        console.log('💡 Payment might not have been created yet');
        return;
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n📋 Manual Testing Instructions:');
  console.log('');
  console.log('🎯 To test the webhook fix:');
  console.log('');
  console.log('1. 📝 Accept a bid (if not already done)');
  console.log('2. 💳 Complete payment using stripe-payment-test.html');
  console.log('3. 👀 Monitor server logs for these messages:');
  console.log('   🔔 WEBHOOK RECEIVED: {timestamp, headers, bodySize}');
  console.log('   ✅ Webhook signature verified successfully');
  console.log('   📨 Received webhook event: payment_intent.succeeded');
  console.log('   💰 Processing payment succeeded');
  console.log('   ✅ Successfully processed payment_intent.succeeded');
  console.log('');
  console.log('4. ✅ Verify results:');
  console.log('   - Payment status changes from PENDING to HELD');
  console.log('   - Bid status remains ACCEPTED');
  console.log('   - No manual intervention needed');
  console.log('');
  console.log('🔧 If webhook still not working:');
  console.log('   - Check Stripe Dashboard webhook events');
  console.log('   - Verify webhook URL: https://nayem5001.binarybards.online/api/v1/payments/webhook');
  console.log('   - Ensure webhook secret matches .env file');
  console.log('   - Check server accessibility from Stripe');
}

// Run the test
testCompletePaymentFlow().catch(console.error);