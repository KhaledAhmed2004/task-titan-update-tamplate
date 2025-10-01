require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
async function testWebhookDirect() {
  try {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/task_titans');
    console.log('✅ Connected to MongoDB');

    // Import the payment service after DB connection
    const { handleWebhookEvent } = require('./dist/app/modules/payment/payment.service.js');

    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_3SDEMqLje7aworqD21kGYmk5',
          metadata: {
            bid_id: '68dc7c9409e220fccb45c151'
          }
        }
      }
    };

    console.log('🧪 Testing webhook processing directly...');
    console.log('Event:', JSON.stringify(mockEvent, null, 2));

    await handleWebhookEvent(mockEvent);
    console.log('✅ Webhook processed successfully');
    
    // Check the updated status
    const BidModel = require('./dist/app/modules/bid/bid.model.js').BidModel;
    const PaymentModel = require('./dist/app/modules/payment/payment.model.js').PaymentModel;
    
    const bid = await BidModel.findById('68dc7c9409e220fccb45c151');
    const payment = await PaymentModel.findOne({ bidId: '68dc7c9409e220fccb45c151' });
    
    console.log('📊 Updated Status:');
    console.log('Bid Status:', bid?.status);
    console.log('Payment Status:', payment?.status);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

testWebhookDirect();