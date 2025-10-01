const mongoose = require('mongoose');
require('dotenv').config();

async function testWebhook() {
  try {
    // Connect to database
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to database');

    // Import PaymentService
    const PaymentService = require('./src/app/modules/payment/payment.service.ts').default;

    // Create mock webhook event with the correct payment intent ID from database
    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_3SDCqrLje7aworqD11ceDhm4', // Using the correct ID from Stripe
          amount: 50000, // $500.00 in cents
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            bid_id: '68dc5db0f239aa3e59119772',
            tasker_id: '68dadc4015eb160254dad9a4'
          }
        }
      }
    };

    console.log('Processing webhook event:', JSON.stringify(mockEvent, null, 2));

    // Process the webhook event
    await PaymentService.handleWebhookEvent(mockEvent);
    console.log('Webhook processed successfully');

    // Check updated bid status
    const updatedBid = await mongoose.connection.db.collection('bids').findOne({
      _id: new mongoose.Types.ObjectId('68dc5db0f239aa3e59119772')
    });
    console.log('Updated bid status:', updatedBid?.status);

    // Check updated payment status
    const updatedPayment = await mongoose.connection.db.collection('payments').findOne({
      bidId: '68dc5db0f239aa3e59119772'
    });
    console.log('Updated payment status:', updatedPayment?.status);

    // Check task status
    const updatedTask = await mongoose.connection.db.collection('tasks').findOne({
      _id: new mongoose.Types.ObjectId(updatedBid?.taskId)
    });
    console.log('Updated task status:', updatedTask?.status);

  } catch (error) {
    console.error('Webhook processing error:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

testWebhook();