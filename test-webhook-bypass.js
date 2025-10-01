// Test webhook by directly calling the service method (bypassing signature verification)
const mongoose = require('mongoose');

async function testWebhookBypassSignature() {
  console.log('🧪 Testing webhook by bypassing signature verification...\n');

  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://admin:adminadmin@cluster0.qbaxzi6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to database');

    // Import the payment service (need to use ts-node for TypeScript modules)
    const PaymentService = require('./src/app/modules/payment/payment.service.ts').default;

    // Create a mock webhook event
    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_payment_intent',
          object: 'payment_intent',
          amount: 50000, // $500.00 in cents
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            bid_id: '68dc54e26dd1a810a3864e53', // Real bid ID with payment_pending status
            poster_id: 'test_poster_id',
            freelancer_id: '68dadc4015eb160254dad9a4'
          },
          charges: {
            data: [
              {
                id: 'ch_test_charge',
                transfer: 'tr_test_transfer'
              }
            ]
          }
        }
      }
    };

    console.log('📤 Processing webhook event directly...');
    console.log('Event:', JSON.stringify(mockEvent, null, 2));

    // Call the webhook handler directly
    await PaymentService.handleWebhookEvent(mockEvent);

    console.log('✅ Webhook event processed successfully!');

    // Check the bid status after processing
    const BidModel = mongoose.model('Bid', new mongoose.Schema({
      taskId: mongoose.Schema.Types.ObjectId,
      taskerId: mongoose.Schema.Types.ObjectId,
      amount: Number,
      message: String,
      status: String,
      paymentIntentId: String
    }, { timestamps: true }));

    const updatedBid = await BidModel.findById('68dc54e26dd1a810a3864e53');
    console.log('\n📊 Updated bid status:', {
      id: updatedBid._id,
      status: updatedBid.status,
      amount: updatedBid.amount
    });

    // Check the task status
    const TaskModel = mongoose.model('Task', new mongoose.Schema({
      title: String,
      status: String,
      assignedTo: mongoose.Schema.Types.ObjectId
    }, { timestamps: true }));

    const task = await TaskModel.findById(updatedBid.taskId);
    console.log('📋 Updated task status:', {
      id: task._id,
      title: task.title,
      status: task.status,
      assignedTo: task.assignedTo
    });

  } catch (error) {
    console.error('❌ Error processing webhook:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testWebhookBypassSignature().catch(console.error);