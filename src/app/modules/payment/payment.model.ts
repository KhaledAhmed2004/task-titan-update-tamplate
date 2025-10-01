import mongoose, { Schema } from 'mongoose';
import { 
  IPayment, 
  IStripeAccountInfo, 
  PaymentModel, 
  StripeAccountModel,
  PaymentStatusType,
  PAYMENT_STATUS,
  BUSINESS_TYPE
} from './payment.interface';

const PaymentSchema = new Schema<IPayment>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    posterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    freelancerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bidId: {
      type: Schema.Types.ObjectId,
      ref: 'Bid',
      required: false,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0,
    },
    freelancerAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
    },
    stripeTransferId: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    refundReason: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PaymentSchema.index({ taskId: 1 });
PaymentSchema.index({ posterId: 1 });
PaymentSchema.index({ freelancerId: 1 });
PaymentSchema.index({ bidId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });

const StripeAccountSchema = new Schema<IStripeAccountInfo>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stripeAccountId: {
      type: String,
      required: true,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    chargesEnabled: {
      type: Boolean,
      default: false,
    },
    payoutsEnabled: {
      type: Boolean,
      default: false,
    },
    country: {
      type: String,
      required: false,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    businessType: {
      type: String,
      enum: Object.values(BUSINESS_TYPE),
      default: BUSINESS_TYPE.INDIVIDUAL,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StripeAccountSchema.index({ userId: 1 });
StripeAccountSchema.index({ stripeAccountId: 1 });

// Payment Model Methods (following project patterns)
PaymentSchema.statics.isExistPaymentById = async function (id: string) {
  return await this.findById(id);
};

PaymentSchema.statics.isExistPaymentByStripeId = async function (stripeId: string) {
  return await this.findOne({ stripePaymentIntentId: stripeId });
};

PaymentSchema.statics.getPaymentsByUser = async function (userId: mongoose.Types.ObjectId) {
  return await this.find({
    $or: [{ posterId: userId }, { freelancerId: userId }]
  }).populate('taskId posterId freelancerId');
};

PaymentSchema.statics.getPaymentsByTask = async function (taskId: mongoose.Types.ObjectId) {
  return await this.find({ taskId }).populate('posterId freelancerId');
};

PaymentSchema.statics.getPaymentsByBid = async function (bidId: mongoose.Types.ObjectId) {
  return await this.find({ bidId }).populate('taskId posterId freelancerId');
};

PaymentSchema.statics.updatePaymentStatus = async function (paymentId: mongoose.Types.ObjectId, status: PaymentStatusType) {
  return await this.findByIdAndUpdate(
    paymentId,
    { status, updatedAt: new Date() },
    { new: true }
  );
};

// Stripe Account Model Methods
StripeAccountSchema.statics.isExistAccountByUserId = async function (userId: mongoose.Types.ObjectId) {
  return await this.findOne({ userId });
};

StripeAccountSchema.statics.isExistAccountByStripeId = async function (stripeId: string) {
  return await this.findOne({ stripeAccountId: stripeId });
};

StripeAccountSchema.statics.updateAccountStatus = async function (userId: mongoose.Types.ObjectId, updates: any) {
  return await this.findOneAndUpdate(
    { userId },
    { ...updates, updatedAt: new Date() },
    { new: true }
  );
};

// Export Models with proper typing
export const Payment = mongoose.model<IPayment, PaymentModel>('Payment', PaymentSchema);
export const StripeAccount = mongoose.model<IStripeAccountInfo, StripeAccountModel>('StripeAccount', StripeAccountSchema);

// Export models with consistent naming
export { Payment as PaymentModel };
export { StripeAccount as StripeAccountModel };