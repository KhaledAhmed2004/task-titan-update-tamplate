const http = require('http');

console.log('🧪 Testing Local Webhook Endpoint...');
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

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/v1/stripe/webhook',
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
    } else {
      console.log('\n❌ Webhook endpoint returned error status');
    }
    
    console.log('\n🔍 Next Steps:');
    console.log('1. Check server logs for webhook processing');
    console.log('2. If no logs appear, webhook handler may not be working');
    console.log('3. If signature error, that\'s expected (we used test signature)');
  });
});

req.on('error', (err) => {
  console.error('\n❌ Connection Error:', err.message);
  console.log('\n🔧 Possible Issues:');
  console.log('- Server is not running on port 5001');
  console.log('- Firewall blocking local connections');
  console.log('- Server crashed or stopped');
  
  console.log('\n💡 Solutions:');
  console.log('- Check if server is running: npm run dev');
  console.log('- Check server logs for errors');
  console.log('- Try restarting the server');
});

req.write(testData);
req.end();