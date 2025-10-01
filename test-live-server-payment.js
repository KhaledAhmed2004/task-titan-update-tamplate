// Live server configuration
const LIVE_SERVER_URL = 'https://nayem5001.binarybards.online';
const API_BASE = `${LIVE_SERVER_URL}/api/v1`;

// Test configuration
const TEST_CONFIG = {
  // You'll need to replace these with actual values from your live server
  authToken: 'YOUR_AUTH_TOKEN_HERE', // Get this from login
  bidId: 'YOUR_BID_ID_HERE', // Get this from a real bid
  posterId: 'YOUR_POSTER_ID_HERE', // Get this from user data
};

async function testLiveServerPaymentFlow() {
  console.log('🚀 Testing Live Server Payment Flow with Automatic Capture Fallback');
  console.log('=' .repeat(70));
  
  try {
    // Step 1: Test server health
    console.log('1️⃣ Testing server health...');
    const healthResponse = await fetch(`${LIVE_SERVER_URL}/`);
    const healthData = await healthResponse.text();
    console.log('✅ Server is live:', healthData);
    
    // Step 2: Test webhook health
    console.log('\n2️⃣ Testing webhook health...');
    const webhookHealthResponse = await fetch(`${API_BASE}/payments/webhook/health`);
    const webhookHealthData = await webhookHealthResponse.json();
    console.log('✅ Webhook endpoint is healthy:', webhookHealthData);
    
    // Step 3: Test payment creation (you'll need to provide actual values)
    if (TEST_CONFIG.authToken === 'YOUR_AUTH_TOKEN_HERE') {
      console.log('\n⚠️  To test payment creation, please update TEST_CONFIG with:');
      console.log('   - authToken: Get from login API');
      console.log('   - bidId: Get from a real bid');
      console.log('   - posterId: Get from user data');
      console.log('\n📝 Example to get auth token:');
      console.log(`   POST ${API_BASE}/auth/login`);
      console.log('   Body: { "email": "your-email", "password": "your-password" }');
      
      console.log('\n📝 Example to create a bid:');
      console.log(`   POST ${API_BASE}/bids`);
      console.log('   Body: { "taskId": "task-id", "amount": 50, "description": "Test bid" }');
      
      return;
    }
    
    // Step 3: Accept bid and create payment
    console.log('\n3️⃣ Testing bid acceptance and payment creation...');
    const acceptBidResponse = await fetch(
      `${API_BASE}/bids/${TEST_CONFIG.bidId}/accept`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const acceptBidData = await acceptBidResponse.json();
    
    if (acceptBidData.success) {
      const { clientSecret, paymentIntentId } = acceptBidData.data;
      console.log('✅ Bid accepted and payment created:');
      console.log(`   Payment Intent ID: ${paymentIntentId}`);
      console.log(`   Client Secret: ${clientSecret.substring(0, 30)}...`);
      
      // Step 4: Monitor automatic capture
      console.log('\n4️⃣ Monitoring automatic capture fallback...');
      console.log('⏳ Waiting 35 seconds for automatic capture to trigger...');
      
      // Wait for automatic capture (30 seconds + 5 seconds buffer)
      await new Promise(resolve => setTimeout(resolve, 35000));
      
      // Step 5: Check payment status
      console.log('\n5️⃣ Checking payment status after automatic capture...');
      const paymentStatusResponse = await fetch(
        `${API_BASE}/payments/status/${paymentIntentId}`,
        {
          headers: {
            'Authorization': `Bearer ${TEST_CONFIG.authToken}`
          }
        }
      );
      
      const paymentStatusData = await paymentStatusResponse.json();
      console.log('💳 Payment Status:', paymentStatusData);
      
      if (paymentStatusData.data.status === 'held') {
        console.log('✅ SUCCESS: Automatic capture fallback worked!');
        console.log('   Payment status: HELD');
        console.log('   Bid should be ACCEPTED');
      } else {
        console.log('⚠️  Payment status is still:', paymentStatusData.data.status);
        console.log('   This might indicate the fallback mechanism needs more time or debugging');
      }
      
    } else {
      console.log('❌ Failed to accept bid:', acceptBidData.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔐 Authentication failed. Please check your auth token.');
    } else if (error.response?.status === 404) {
      console.log('\n🔍 Resource not found. Please check your bid ID and other IDs.');
    }
  }
}

// Helper function to get auth token
async function getAuthToken(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      return response.data.data.accessToken;
    } else {
      throw new Error('Login failed: ' + response.data.message);
    }
  } catch (error) {
    console.error('❌ Failed to get auth token:', error.response?.data || error.message);
    return null;
  }
}

// Helper function to create a test bid
async function createTestBid(authToken, taskId, amount = 50) {
  try {
    const response = await axios.post(
      `${API_BASE}/bids`,
      {
        taskId,
        amount,
        description: 'Test bid for payment flow testing',
        deliveryTime: 7
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      return response.data.data._id;
    } else {
      throw new Error('Bid creation failed: ' + response.data.message);
    }
  } catch (error) {
    console.error('❌ Failed to create test bid:', error.response?.data || error.message);
    return null;
  }
}

// Export helper functions for manual testing
module.exports = {
  testLiveServerPaymentFlow,
  getAuthToken,
  createTestBid,
  LIVE_SERVER_URL,
  API_BASE
};

// Run the test if this file is executed directly
if (require.main === module) {
  testLiveServerPaymentFlow();
}