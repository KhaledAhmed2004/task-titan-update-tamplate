require('dotenv').config();
const mongoose = require('mongoose');
const Stripe = require('stripe');

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Import models from compiled JS
const { Payment } = require('./dist/app/modules/payment/payment.model');
const { BidModel } = require('./dist/app/modules/bid/bid.model');

async function fixPaymentCapture() {
  try {
    console.log('🔧 Starting payment capture fix...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');

    // Find pending payments
    const pendingPayments = await Payment.find({ 
      status: 'pending' 
    }).populate('bidId');

    console.log(`📋 Found ${pendingPayments.length} pending payments`);

    for (const payment of pendingPayments) {
      console.log(`\n🔍 Processing payment: ${payment._id}`);
      console.log(`   Stripe Payment Intent: ${payment.stripePaymentIntentId}`);
      console.log(`   Bid ID: ${payment.bidId}`);

      try {
        // Get current payment intent status from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(
          payment.stripePaymentIntentId
        );

        console.log(`   Current Stripe status: ${paymentIntent.status}`);

        if (paymentIntent.status === 'requires_capture') {
          console.log('   💰 Capturing payment...');
          
          // Capture the payment
          const capturedPayment = await stripe.paymentIntents.capture(
            payment.stripePaymentIntentId
          );

          console.log(`   ✅ Payment captured successfully: ${capturedPayment.status}`);

          // Update payment status in database
          await Payment.findByIdAndUpdate(payment._id, {
            status: 'held',
            updatedAt: new Date()
          });

          console.log('   ✅ Database payment status updated to HELD');

          // Update bid status if exists
          if (payment.bidId) {
            await BidModel.findByIdAndUpdate(payment.bidId._id, {
              status: 'accepted',
              updatedAt: new Date()
            });
            console.log('   ✅ Bid status updated to ACCEPTED');
          }

        } else if (paymentIntent.status === 'succeeded') {
          console.log('   ✅ Payment already succeeded, updating database...');
          
          // Update payment status in database
          await Payment.findByIdAndUpdate(payment._id, {
            status: 'held',
            updatedAt: new Date()
          });

          console.log('   ✅ Database payment status updated to HELD');

          // Update bid status if exists
          if (payment.bidId) {
            await BidModel.findByIdAndUpdate(payment.bidId._id, {
              status: 'accepted',
              updatedAt: new Date()
            });
            console.log('   ✅ Bid status updated to ACCEPTED');
          }

        } else {
          console.log(`   ⚠️  Payment status is ${paymentIntent.status}, no action needed`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing payment ${payment._id}:`, error.message);
        
        // Handle already captured error
        if (error.message && error.message.includes('already been captured')) {
          console.log('   ✅ Payment was already captured, updating database...');
          
          await Payment.findByIdAndUpdate(payment._id, {
            status: 'held',
            updatedAt: new Date()
          });

          if (payment.bidId) {
            await BidModel.findByIdAndUpdate(payment.bidId._id, {
              status: 'accepted',
              updatedAt: new Date()
            });
          }
          
          console.log('   ✅ Database updated successfully');
        }
      }
    }

    console.log('\n🎉 Payment capture fix completed!');
    
    // Show final status
    const updatedPayments = await Payment.find({}).populate('bidId');
    console.log('\n📊 Final Payment Status Summary:');
    
    const statusCounts = {};
    updatedPayments.forEach(payment => {
      statusCounts[payment.status] = (statusCounts[payment.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} payments`);
    });

  } catch (error) {
    console.error('❌ Error in payment capture fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the fix
fixPaymentCapture();