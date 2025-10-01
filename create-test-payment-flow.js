// Complete test flow for webhook demonstration
const API_BASE = 'https://nayem5001.binarybards.online/api/v1';

// Test credentials - update these with valid ones
const TEST_USER = {
  email: 'test@example.com',
  password: 'your_password'
};

async function createCompleteTestFlow() {
  console.log('🧪 Creating Complete Test Flow for Webhook');
  console.log('=' + '='.repeat(60));
  
  let authToken = '';
  
  try {
    // Step 1: Login
    console.log('\n1️⃣ Attempting login...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    
    if (!loginRes.ok) {
      console.log('❌ Login failed. Please update TEST_USER credentials');
      console.log('💡 Or use existing auth token manually');
      return;
    }
    
    const loginData = await loginRes.json();
    authToken = loginData.data.accessToken;
    console.log('✅ Login successful');

    // Step 2: Get or create a task
    console.log('\n2️⃣ Getting available tasks...');
    const tasksRes = await fetch(`${API_BASE}/tasks`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    let taskId = '';
    if (tasksRes.ok) {
      const tasks = await tasksRes.json();
      if (tasks.data.length > 0) {
        taskId = tasks.data[0]._id;
        console.log('✅ Using existing task:', taskId.slice(-8));
      }
    }
    
    if (!taskId) {
      console.log('❌ No tasks found. Please create a task first');
      return;
    }

    // Step 3: Create a bid
    console.log('\n3️⃣ Creating test bid...');
    const bidRes = await fetch(`${API_BASE}/bids`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        taskId: taskId,
        amount: 50,
        description: 'Test bid for webhook demonstration',
        deliveryTime: 3
      })
    });
    
    if (!bidRes.ok) {
      console.log('❌ Failed to create bid');
      return;
    }
    
    const bidData = await bidRes.json();
    const bidId = bidData.data._id;
    console.log('✅ Bid created:', bidId.slice(-8));

    // Step 4: Accept the bid (if you're the task owner)
    console.log('\n4️⃣ Accepting bid...');
    const acceptRes = await fetch(`${API_BASE}/bids/${bidId}/accept`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (acceptRes.ok) {
      console.log('✅ Bid accepted');
    } else {
      console.log('⚠️  Could not accept bid (might not be task owner)');
      console.log('💡 Please accept the bid manually in the app');
    }

    // Step 5: Create payment
    console.log('\n5️⃣ Creating payment...');
    const paymentRes = await fetch(`${API_BASE}/payments/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bidId: bidId,
        amount: 50
      })
    });
    
    if (!paymentRes.ok) {
      console.log('❌ Failed to create payment');
      return;
    }
    
    const paymentData = await paymentRes.json();
    const clientSecret = paymentData.data.clientSecret;
    console.log('✅ Payment created');
    console.log('🔐 Client Secret:', clientSecret);

    // Step 6: Instructions for completing payment
    console.log('\n6️⃣ Complete Payment Instructions:');
    console.log('=' + '='.repeat(40));
    console.log('');
    console.log('🌐 1. Open stripe-payment-test.html in browser');
    console.log('🔐 2. Paste this client secret:');
    console.log(`     ${clientSecret}`);
    console.log('💳 3. Use test card: 4242424242424242');
    console.log('📅 4. Use any future date and any CVC');
    console.log('✅ 5. Click "Confirm Payment"');
    console.log('');
    console.log('👀 6. Monitor server logs for webhook:');
    console.log('     🔔 WEBHOOK RECEIVED');
    console.log('     ✅ Webhook signature verified');
    console.log('     📨 Received webhook event: payment_intent.succeeded');
    console.log('     💰 Processing payment succeeded');
    console.log('');
    console.log('🎯 Expected Results:');
    console.log('   - Payment status: PENDING → HELD');
    console.log('   - Stripe Dashboard: Payment captured');
    console.log('   - No manual intervention needed');
    console.log('');
    console.log('🔧 If webhook doesn\'t work:');
    console.log('   - Check Stripe Dashboard webhook configuration');
    console.log('   - Verify webhook URL and events');
    console.log('   - Check server accessibility');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
createCompleteTestFlow().catch(console.error);