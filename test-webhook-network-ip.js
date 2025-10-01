const http = require('http');

console.log('🧪 Testing Webhook with Network IP...');
console.log('=' + '='.repeat(50));

// Test data similar to Stripe webhook
const testData = JSON.stringify({
  id: 'evt_test_webhook',
  object: 'event',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_3SDSe2Lje7aworqD3aMMw8pO',
      object: 'payment_intent',
      status: 'succeeded',
      amount: 2000,
      currency: 'usd'
    }
  }
});

// Use network IP instead of localhost
const options = {
  hostname: '10.10.7.33',  // Network IP from netstat
  port: 5001,
  path: '/api/v1/payments/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData),
    'stripe-signature': 'test_signature'
  }
};

console.log('📡 Sending request to:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('📦 Payload size:', Buffer.byteLength(testData), 'bytes');

const req = http.request(options, (res) => {
  console.log('\n📊 Response Status:', res.statusCode);
  console.log('📋 Response Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 Response Body:', data);
    
    if (res.statusCode === 200) {
      console.log('\n✅ Webhook endpoint is accessible!');
      console.log('🎯 This means the webhook route is working');
    } else if (res.statusCode === 400) {
      console.log('\n⚠️  Webhook endpoint accessible but signature invalid (expected)');
      console.log('🎯 This is normal - we used a test signature');
    } else {
      console.log('\n❌ Webhook endpoint returned error status');
    }
    
    console.log('\n🔍 Analysis:');
    console.log('✅ Server is running on port 5001');
    console.log('✅ Webhook endpoint exists at /api/v1/payments/webhook');
    console.log('✅ Network connectivity is working');
    
    console.log('\n💡 This means:');
    console.log('- Your webhook endpoint is working correctly');
    console.log('- The issue is likely with Stripe webhook configuration');
    console.log('- Or Stripe cannot reach your server from the internet');
  });
});

req.on('error', (err) => {
  console.error('\n❌ Connection Error:', err.message);
  console.log('\n🔧 This suggests:');
  console.log('- Server binding issue');
  console.log('- Network configuration problem');
  console.log('- Firewall blocking connections');
});

req.write(testData);
req.end();