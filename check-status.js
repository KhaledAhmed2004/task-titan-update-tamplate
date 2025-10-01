require('dotenv').config();
const mongoose = require('mongoose');

async function checkStatus() {
  try {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/task_titans');
    console.log('✅ Connected to MongoDB');

    // Import models
    const { BidModel } = require('./dist/app/modules/bid/bid.model.js');
    const { PaymentModel } = require('./dist/app/modules/payment/payment.model.js');
    const { TaskModel } = require('./dist/app/modules/task/task.model.js');

    const bidId = '68dc7c9409e220fccb45c151'; // New bid ID
    
    console.log('🔍 Checking current status...');
    
    // Check bid status
    const bid = await BidModel.findById(bidId);
    console.log('📋 Bid Status:', bid?.status);
    console.log('📋 Bid Details:', {
      id: bid?._id,
      taskId: bid?.taskId,
      freelancerId: bid?.freelancerId,
      amount: bid?.amount,
      status: bid?.status
    });
    
    // Check payment status
    const payment = await PaymentModel.findOne({ bidId: bidId });
    console.log('💳 Payment Status:', payment?.status);
    console.log('💳 Payment Details:', {
      id: payment?._id,
      bidId: payment?.bidId,
      amount: payment?.amount,
      status: payment?.status,
      stripePaymentIntentId: payment?.stripePaymentIntentId
    });
    
    // Check task status if bid exists
    if (bid?.taskId) {
      const task = await TaskModel.findById(bid.taskId);
      console.log('📝 Task Status:', task?.status);
      console.log('📝 Task Details:', {
        id: task?._id,
        title: task?.title,
        status: task?.status,
        assignedFreelancer: task?.assignedFreelancer
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkStatus();