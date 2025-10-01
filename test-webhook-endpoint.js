const fetch = require("node-fetch");

async function testWebhookEndpoint() {
  try {
    console.log("🔍 Testing webhook endpoint accessibility...");
    
    // Test webhook health check first
    const healthResponse = await fetch("http://localhost:5001/api/v1/payments/webhook/health");
    const healthData = await healthResponse.text();
    console.log("✅ Webhook health check:", healthResponse.status, healthData);
    
    // Test webhook endpoint with dummy data (will fail signature but shows endpoint works)
    const testPayload = {
      id: "evt_test_webhook",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_3SDDNgLje7aworqD2TNYAve1",
          metadata: {
            bid_id: "68dc6d8af239aa3e5911979a"
          }
        }
      }
    };
    
    const webhookResponse = await fetch("http://localhost:5001/api/v1/payments/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "test_signature"
      },
      body: JSON.stringify(testPayload)
    });
    
    const webhookData = await webhookResponse.text();
    console.log("📡 Webhook endpoint test:", webhookResponse.status, webhookData);
    
    if (webhookResponse.status === 400 && webhookData.includes("signature")) {
      console.log("✅ Webhook endpoint is working (signature verification failed as expected)");
    }
    
  } catch (error) {
    console.error("❌ Error testing webhook:", error.message);
  }
}

testWebhookEndpoint();