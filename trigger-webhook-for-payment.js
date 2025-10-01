require('dotenv').config();
const mongoose = require('mongoose');

async function triggerWebhookForPayment() {
  try {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/task_titans');
    console.log('✅ Connected to MongoDB');

    // Import the payment service
    const { handleWebhookEvent } = require('./dist/app/modules/payment/payment.service.js');

    // Your specific payment intent that's still pending
    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_3SDEMqLje7aworqD21kGYmk5', // Your actual payment intent ID
          metadata: {
            bid_id: '68dc7c9409e220fccb45c151' // Your actual bid ID
          }
        }
      }
    };

    console.log('🚀 Triggering webhook for your payment...');
    console.log('Payment Intent ID:', mockEvent.data.object.id);
    console.log('Bid ID:', mockEvent.data.object.metadata.bid_id);

    await handleWebhookEvent(mockEvent);
    console.log('✅ Webhook processed successfully!');
    
    // Check the updated status
    const { BidModel } = require('./dist/app/modules/bid/bid.model.js');
    const { PaymentModel } = require('./dist/app/modules/payment/payment.model.js');
    const { TaskModel } = require('./dist/app/modules/task/task.model.js');
    
    const bid = await BidModel.findById('68dc7c9409e220fccb45c151');
    const payment = await PaymentModel.findOne({ bidId: '68dc7c9409e220fccb45c151' });
    const task = await TaskModel.findById(bid?.taskId);
    
    console.log('\n📊 Updated Status:');
    console.log('✅ Bid Status:', bid?.status);
    console.log('✅ Payment Status:', payment?.status);
    console.log('✅ Task Status:', task?.status);
    
    if (bid?.status === 'accepted' && payment?.status === 'held' && task?.status === 'in_progress') {
      console.log('\n🎉 SUCCESS! All statuses updated correctly!');
    } else {
      console.log('\n❌ Something went wrong with the status updates');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

triggerWebhookForPayment();