import {
  IStripeAccount,
  IEscrowPayment,
  IPaymentRelease,
  IPayment,
  IPaymentFilters,
  IPaymentStats,
  PAYMENT_STATUS,
} from './payment.interface';
import mongoose from 'mongoose';
import {
  Payment,
  Payment as PaymentModel,
  StripeAccount as StripeAccountModel,
} from './payment.model';
import { User } from '../user/user.model';
import { TaskModel } from '../task/task.model';
import { TaskStatus } from '../task/task.interface';
import { BidModel } from '../bid/bid.model';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import {
  stripe,
  dollarsToCents,
  calculatePlatformFee,
  calculateFreelancerAmount,
  handleStripeError,
} from '../../../config/stripe';

// Create Stripe Connect account for freelancers
export const createStripeAccount = async (
  data: IStripeAccount
): Promise<any> => {
  try {
    // Get user details
    const user = await User.findById(data.userId).select(
      'name email phone dateOfBirth location'
    );

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Check if user already has a Stripe account
    const existingAccount = await StripeAccountModel.isExistAccountByUserId(
      data.userId
    );
    if (existingAccount) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'User already has a Stripe account'
      );
    }

    // Prepare DOB if exists
    let dob;
    if (user.dateOfBirth) {
      const parts = user.dateOfBirth.split('-'); // format: YYYY-MM-DD
      dob = {
        year: Number(parts[0]),
        month: Number(parts[1]),
        day: Number(parts[2]),
      };
    }

    // // Format phone number if exists
    // let formattedPhone = user.phone;
    // if (formattedPhone) {
    //   const phoneNumber = parsePhoneNumberFromString(formattedPhone, 'US');
    //   if (phoneNumber && phoneNumber.isValid()) {
    //     formattedPhone = phoneNumber.formatInternational();
    //   } else {
    //     throw new Error('Invalid phone number format');
    //   }
    // }
    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        first_name: user.name.split(' ')[0],
        last_name: user.name.split(' ')[1] || '',
        email: user.email,
        // phone: user.phone || undefined,
        dob,
        address: {
          city: user.location || undefined,
          country: 'US',
        },
      },
      metadata: {
        user_id: data.userId.toString(),
        account_type: data.accountType,
      },
    });

    // Save account details to database
    const stripeAccount = new StripeAccountModel({
      userId: data.userId,
      stripeAccountId: account.id,
      onboardingCompleted: false,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      country: account.country,
      currency: account.default_currency || 'usd',
      businessType: account.business_type || 'individual',
    });
    await stripeAccount.save();

    return {
      account_id: account.id,
      onboarding_required: !account.charges_enabled,
      database_record: stripeAccount,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to create Stripe account: ${handleStripeError(error)}`
    );
  }
};

// Create onboarding link for freelancer
export const createOnboardingLink = async (userId: string): Promise<string> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const stripeAccount = await StripeAccountModel.isExistAccountByUserId(
      userObjectId
    );

    if (!stripeAccount) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Stripe account not found. Please create an account first.'
      );
    }

    if (stripeAccount.onboardingCompleted) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'User has already completed onboarding'
      );
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.stripeAccountId,
      refresh_url: `${process.env.FRONTEND_URL}/onboarding/refresh`,
      return_url: `${process.env.FRONTEND_URL}/onboarding/complete`,
      type: 'account_onboarding',
    });

    return accountLink.url;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to create onboarding link: ${handleStripeError(error)}`
    );
  }
};

// Check if freelancer has completed Stripe onboarding
export const checkOnboardingStatus = async (
  userId: string
): Promise<{
  completed: boolean;
  account_id?: string;
  missing_fields?: string[];
}> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const stripeAccount = await StripeAccountModel.isExistAccountByUserId(
      userObjectId
    );

    if (!stripeAccount) {
      return { completed: false };
    }

    // Check with Stripe for latest status
    const account = await stripe.accounts.retrieve(
      stripeAccount.stripeAccountId
    );
    console.log(account);
    const completed = account.charges_enabled && account.payouts_enabled;
    const currentlyDue = account?.requirements?.currently_due; // Array of missing fields

    // Update local status if changed
    if (completed !== stripeAccount.onboardingCompleted) {
      await StripeAccountModel.updateAccountStatus(stripeAccount.userId, {
        onboardingCompleted: completed,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      });
    }

    return {
      completed,
      account_id: stripeAccount.stripeAccountId,
      // missing_fields: currentlyDue,
      missing_fields: currentlyDue ?? undefined,
    };
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to check onboarding status: ${handleStripeError(error)}`
    );
  }
};

// Create escrow payment when bid is accepted
export const createEscrowPayment = async (
  data: IEscrowPayment
): Promise<{ payment: IPayment; client_secret: string }> => {
  try {
    // Validate bid exists and get details
    const bid = await BidModel.findById(data.bidId).populate('taskId');

    if (!bid) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Bid not found');
    }

    const task = bid.taskId as any;
    // if (task.userId !== data.posterId) {
    //   throw new ApiError(
    //     httpStatus.FORBIDDEN,
    //     'You are not authorized to accept this bid'
    //   );
    // }

    // Check freelancer's Stripe account
    if (!bid.taskerId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Bid does not have an assigned freelancer'
      );
    }
    const freelancerStripeAccount =
      await StripeAccountModel.isExistAccountByUserId(bid.taskerId);
    if (
      !freelancerStripeAccount ||
      !freelancerStripeAccount.onboardingCompleted
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Freelancer has not completed Stripe onboarding'
      );
    }

    // Check if payment already exists for this bid
    if (!data.bidId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Bid ID is required for escrow payment'
      );
    }
    if (!data.posterId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Poster ID is required for escrow payment'
      );
    }

    const existingPayment = await PaymentModel.getPaymentsByBid(data.bidId);

    if (existingPayment && existingPayment.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Payment already exists for this bid'
      );
    }

    const platformFee = calculatePlatformFee(data.amount);
    const freelancerAmount = calculateFreelancerAmount(data.amount);

    // Separate charges and transfers model:
    // Charge on the platform account; transfer to freelancer on task completion.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: dollarsToCents(data.amount),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      capture_method: 'manual', // authorize now; we'll capture at acceptance webhook
      metadata: {
        bid_id: data.bidId.toString(),
        poster_id: data.posterId.toString(),
        freelancer_id: data.freelancerId.toString(),
        task_title: task.title,
        type: 'escrow_payment',
      },
    });

    // Create payment record in database
    const payment = new PaymentModel({
      taskId: data.taskId,
      bidId: data.bidId,
      // posterId: data.clientId,
      posterId: data.posterId,
      freelancerId: data.freelancerId,
      amount: data.amount,
      platformFee: platformFee,
      freelancerAmount: freelancerAmount,
      stripePaymentIntentId: paymentIntent.id,
      status: PAYMENT_STATUS.PENDING,
      currency: 'usd',
      metadata: data.metadata,
    });
    await payment.save();

    return {
      payment: payment as IPayment,
      client_secret: paymentIntent.client_secret!,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to create escrow payment: ${handleStripeError(error)}`
    );
  }
};

// Release payment when task is completed and approved
export const releaseEscrowPayment = async (
  data: IPaymentRelease
): Promise<{
  success: boolean;
  message: string;
  freelancer_amount: number;
  platform_fee: number;
}> => {
  try {
    const payment = await PaymentModel.isExistPaymentById(
      data.paymentId.toString()
    );

    if (!payment) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    // Capture-at-acceptance model: allow release only when captured/held.
    if (payment.status !== PAYMENT_STATUS.HELD) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Payment is not in held status. Current status: ${payment.status}`
      );
    }

    // Verify authorization - check if the client is the poster of the task
    const task = await TaskModel.findById(payment.taskId);
    if (!task || task.userId.toString() !== data.clientId?.toString()) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You are not authorized to release this payment'
      );
    }

    // Retrieve PaymentIntent and locate its associated charge robustly
    const paymentIntent = await stripe.paymentIntents.retrieve(
      payment.stripePaymentIntentId,
      { expand: ['latest_charge'] }
    );

    // Try latest_charge first
    let chargeId: string | undefined;
    const latestCharge: any = (paymentIntent as any).latest_charge;
    if (typeof latestCharge === 'string') {
      chargeId = latestCharge;
    } else if (latestCharge && latestCharge.id) {
      chargeId = latestCharge.id;
    }

    // Fallback: list charges by payment_intent
    if (!chargeId) {
      const chargeList = await stripe.charges.list({
        payment_intent: payment.stripePaymentIntentId,
        limit: 1,
      });
      if (chargeList.data && chargeList.data.length > 0) {
        chargeId = chargeList.data[0].id;
      }
    }

    // Final fallback: allow transfer without source_transaction
    const canTransferWithoutSource = !chargeId;

    // Get freelancer Stripe account
    const freelancerStripeAccount = await StripeAccountModel.isExistAccountByUserId(
      payment.freelancerId
    );
    if (!freelancerStripeAccount?.stripeAccountId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Freelancer Stripe account not found'
      );
    }

    // Create transfer to freelancer for freelancerAmount (platform keeps fee)
    await stripe.transfers.create({
      amount: dollarsToCents(payment.freelancerAmount),
      currency: payment.currency || 'usd',
      destination: freelancerStripeAccount.stripeAccountId,
      ...(canTransferWithoutSource ? {} : { source_transaction: chargeId }),
      metadata: {
        bid_id: payment.bidId?.toString?.() || String(payment.bidId),
        payment_id: payment._id?.toString?.() || String(payment._id),
        intent_id: payment.stripePaymentIntentId,
        type: 'escrow_release_transfer',
      },
    });

    // Update payment status
    await PaymentModel.updatePaymentStatus(
      data.paymentId,
      PAYMENT_STATUS.RELEASED
    );

    // Update bid status to completed
    await BidModel.findByIdAndUpdate(payment.bidId, {
      status: 'completed',
    });

    return {
      success: true,
      message: 'Payment released and transferred to freelancer successfully',
      freelancer_amount: payment.freelancerAmount,
      platform_fee: payment.platformFee,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to release payment: ${handleStripeError(error)}`
    );
  }
};

// Refund escrow payment
export const refundEscrowPayment = async (
  paymentId: string,
  reason?: string
): Promise<any> => {
  try {
    const payment = await PaymentModel.isExistPaymentById(paymentId);

    if (!payment) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    if (payment.status === PAYMENT_STATUS.REFUNDED) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Payment has already been refunded'
      );
    }

    if (payment.status === PAYMENT_STATUS.RELEASED) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Cannot refund a payment that has already been released'
      );
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        payment_id: paymentId,
        refund_reason: reason || 'No reason provided',
      },
    });

    // Update payment status
    await PaymentModel.updatePaymentStatus(
      new mongoose.Types.ObjectId(paymentId),
      PAYMENT_STATUS.REFUNDED
    );

    // Update refund reason if provided
    if (reason) {
      await PaymentModel.findByIdAndUpdate(paymentId, {
        refundReason: reason,
      });
    }

    // Update bid status
    await BidModel.findByIdAndUpdate(payment.bidId, {
      status: 'cancelled',
    });

    return {
      success: true,
      refund_id: refund.id,
      amount_refunded: refund.amount / 100, // Convert cents to dollars
      message: 'Payment refunded successfully',
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to refund payment: ${handleStripeError(error)}`
    );
  }
};

// Get payment by ID
export const getPaymentById = async (
  paymentId: string
): Promise<IPayment | null> => {
  try {
    const payment = await PaymentModel.isExistPaymentById(paymentId);

    return payment as IPayment;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to get payment: ${errorMessage}`
    );
  }
};

// Get payments with filters and pagination
export const getPayments = async (
  filters: IPaymentFilters,
  page: number = 1,
  limit: number = 10
): Promise<{
  payments: IPayment[];
  total: number;
  totalPages: number;
  currentPage: number;
}> => {
  try {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.posterId = filters.clientId;
    if (filters.freelancerId) where.freelancerId = filters.freelancerId;
    if (filters.bidId) where.bidId = filters.bidId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.$lte = filters.dateTo;
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      PaymentModel.find(where)
        .populate({
          path: 'bidId',
          populate: [
            {
              path: 'taskId',
              select: 'title',
            },
            {
              path: 'taskerId',
              select: 'name email',
            },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PaymentModel.countDocuments(where),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      payments: payments as IPayment[],
      total,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to get payments: ${errorMessage}`
    );
  }
};

// Get payment statistics
export const getPaymentStats = async (
  filters?: IPaymentFilters
): Promise<IPaymentStats> => {
  try {
    const where: any = {};

    if (filters?.clientId) where.posterId = filters.clientId;
    if (filters?.freelancerId) where.freelancerId = filters.freelancerId;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.$lte = filters.dateTo;
    }

    const [totalStats, statusBreakdown, monthlyTrend] = await Promise.all([
      PaymentModel.aggregate([
        { $match: where },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalPlatformFees: { $sum: '$platformFee' },
            totalFreelancerPayouts: { $sum: '$freelancerAmount' },
            averagePayment: { $avg: '$amount' },
          },
        },
      ]),
      PaymentModel.aggregate([
        { $match: where },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      PaymentModel.aggregate([
        { $match: where },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            totalAmount: { $sum: '$amount' },
            paymentCount: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
    ]);

    const stats = totalStats[0] || {
      totalPayments: 0,
      totalAmount: 0,
      totalPlatformFees: 0,
      totalFreelancerPayouts: 0,
      averagePayment: 0,
    };

    const statusBreakdownObj: Record<string, number> = {};
    statusBreakdown.forEach((item: any) => {
      statusBreakdownObj[item._id] = item.count;
    });

    const monthlyTrendFormatted = monthlyTrend.map((item: any) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      totalAmount: item.totalAmount,
      paymentCount: item.paymentCount,
    }));

    return {
      totalPayments: stats.totalPayments,
      totalAmount: stats.totalAmount,
      totalPlatformFees: stats.totalPlatformFees,
      totalFreelancerPayouts: stats.totalFreelancerPayouts,
      pendingPayments: statusBreakdownObj[PAYMENT_STATUS.PENDING] || 0,
      completedPayments: statusBreakdownObj[PAYMENT_STATUS.RELEASED] || 0,
      refundedPayments: statusBreakdownObj[PAYMENT_STATUS.REFUNDED] || 0,
      averagePayment: stats.averagePayment,
      statusBreakdown: statusBreakdownObj as any,
      monthlyTrend: monthlyTrendFormatted,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to get payment stats: ${errorMessage}`
    );
  }
};

// Handle Stripe webhook events
export const handleWebhookEvent = async (event: any): Promise<void> => {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'account.updated':
      await handleAccountUpdated(event.data.object);
      break;
    case 'payment_intent.amount_capturable_updated':
      await handleAmountCapturableUpdated(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

// Handle payment succeeded webhook
const handlePaymentSucceeded = async (paymentIntent: any): Promise<void> => {
  const bidId = paymentIntent.metadata?.bid_id;

  try {
    // After capture, confirm local status HELD (funds on platform balance)
    await PaymentModel.updateMany(
      {
        bidId: bidId,
        stripePaymentIntentId: paymentIntent.id,
      },
      {
        status: PAYMENT_STATUS.HELD,
      }
    );
    // Do not re-trigger bid acceptance here; amount_capturable_updated handles capture + acceptance
    console.log(`Payment ${paymentIntent.id} succeeded; status set to HELD. No duplicate acceptance triggered.`);
  } catch (error) {
    console.error(`Error in handlePaymentSucceeded for payment ${paymentIntent.id}:`, error);
  }
};

// Handle payment failed webhook
const handlePaymentFailed = async (paymentIntent: any): Promise<void> => {
  const bidId = paymentIntent.metadata.bid_id;

  // Update payment status to REFUNDED
  await PaymentModel.updateMany(
    {
      bidId: bidId,
      stripePaymentIntentId: paymentIntent.id,
    },
    {
      status: PAYMENT_STATUS.REFUNDED,
    }
  );

  // Reset bid status back to PENDING so it can be re-attempted
  await BidModel.findByIdAndUpdate(bidId, {
    status: 'pending',
    paymentIntentId: null, // Clear the failed payment intent
  });

  // Revert task assignment and status if this bid was already accepted
  try {
    const bid = await BidModel.findById(bidId);
    if (bid) {
      const task = await TaskModel.findById(bid.taskId);
      if (task) {
        // Only revert if the task is currently assigned to this tasker
        const assignedMatches = task.assignedTo?.toString() === bid.taskerId?.toString();
        if (assignedMatches) {
          await TaskModel.findByIdAndUpdate(task._id, {
            status: TaskStatus.OPEN,
            assignedTo: null,
            paymentIntentId: null,
          });
        }
      }
    }
  } catch (revertErr) {
    console.error('Failed to revert task state after payment failure:', revertErr);
  }
};

// Handle account updated webhook
const handleAccountUpdated = async (account: any): Promise<void> => {
  const completed = account.charges_enabled && account.payouts_enabled;

  await StripeAccountModel.updateMany(
    {
      stripeAccountId: account.id,
    },
    {
      onboardingCompleted: completed,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    }
  );
};

// Handle amount capturable updated webhook (manual capture flow)
const handleAmountCapturableUpdated = async (paymentIntent: any): Promise<void> => {
  const bidId = paymentIntent.metadata?.bid_id;

  try {
    if (!bidId) {
      console.error('❌ No bid_id in payment intent metadata for amount_capturable_updated:', paymentIntent.metadata);
      return;
    }

    console.log(`Payment ${paymentIntent.id} is now capturable, capturing to hold funds on platform...`);

    try {
      // Capture the payment on the platform account (no transfer_data configured)
      const capturedPayment = await stripe.paymentIntents.capture(paymentIntent.id);
      console.log(`Payment ${paymentIntent.id} captured successfully (amount_capturable_updated handler)`);

      // Mark local payment as HELD (captured and held in platform balance)
      await PaymentModel.updateMany(
        {
          bidId: bidId,
          stripePaymentIntentId: paymentIntent.id,
        },
        {
          status: PAYMENT_STATUS.HELD,
        }
      );
    } catch (captureError: any) {
      console.error(`Failed to capture payment ${paymentIntent.id} in amount_capturable_updated handler:`, captureError);
      if (captureError.message && captureError.message.includes('already been captured')) {
        console.log(`Payment ${paymentIntent.id} was already captured`);
        await PaymentModel.updateMany(
          {
            bidId: bidId,
            stripePaymentIntentId: paymentIntent.id,
          },
          {
            status: PAYMENT_STATUS.HELD,
          }
        );
      } else {
        return;
      }
    }

    // Complete bid acceptance process after successful capture
    const { BidService } = await import('../bid/bid.service');
    try {
      await BidService.completeBidAcceptance(bidId);
      console.log(`Bid ${bidId} acceptance completed after capture (amount_capturable_updated).`);
    } catch (error) {
      console.error('Failed to complete bid acceptance after capture:', error);
    }
  } catch (error) {
    console.error(`Error in handleAmountCapturableUpdated for payment ${paymentIntent.id}:`, error);
  }
};

// Get user payments (for user-specific routes)
export const getUserPayments = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  payments: IPayment[];
  total: number;
  totalPages: number;
  currentPage: number;
}> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const payments = await PaymentModel.getPaymentsByUser(userObjectId);
    const total = payments.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedPayments = payments.slice(skip, skip + limit);

    return {
      payments: paginatedPayments,
      total,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to get user payments: ${errorMessage}`
    );
  }
};

// Get user payment statistics
export const getUserPaymentStats = async (
  userId: string
): Promise<IPaymentStats> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filters: IPaymentFilters = {
      posterId: userObjectId,
      freelancerId: userObjectId,
    };

    return await getPaymentStats(filters);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to get user payment stats: ${errorMessage}`
    );
  }
};

const deleteStripeAccountService = async (accountId: string) => {
  try {
    // Delete account from Stripe
    const deleted = await stripe.accounts.del(accountId);

    if (!deleted.deleted) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to delete account');
    }

    return deleted; // { id, object, deleted: true }
  } catch (error: any) {
    throw handleStripeError(error);
  }
};

// Get payment history for poster, tasker, super admin with QueryBuilder
const getPaymentHistory = async (
  userId: string,
  query: Record<string, unknown>
) => {
  try {
    // 🔹 Use string directly for Mongoose to cast automatically
    const objectId = userId;

    // Base query (poster or freelancer) + populate freelancer name
    const baseQuery = Payment.find({
      $or: [{ posterId: objectId }, { freelancerId: objectId }],
    }).populate('freelancerId', 'name'); // populate only name field

    // Query builder with populate
    const queryBuilder = new QueryBuilder<IPayment>(baseQuery, query)
      .search(['status', 'currency'])
      .filter()
      .dateFilter()
      .sort()
      .paginate()
      .fields();

    // Execute query with pagination
    const { data: payments, pagination } =
      await queryBuilder.getFilteredResults();

    // Format data
    const formattedPayments = payments.map((payment) => ({
      paymentId: payment.stripePaymentIntentId,
      taskerName: payment.freelancerId ? (payment.freelancerId as any).name : 'N/A',
      amount: payment.amount,
      transactionDate: payment.createdAt,
      paymentStatus: payment.status,
    }));

    return {
      success: true,
      data: formattedPayments,
      pagination,
    };
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to fetch payment history'
    );
  }
};

// Retrieve current Stripe PaymentIntent for a bid and return client_secret when applicable
export const getCurrentIntentByBid = async (
  bidId: string
): Promise<{
  bidId: string;
  paymentId?: string;
  stripePaymentIntentId?: string;
  intent_status: string;
  client_secret?: string;
}> => {
  if (!mongoose.isValidObjectId(bidId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid bidId');
  }

  const payments = await PaymentModel.getPaymentsByBid(
    new mongoose.Types.ObjectId(bidId)
  );

  if (!payments || payments.length === 0) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'No payment found for this bid'
    );
  }

  // Prefer pending payment; otherwise take the most recent
  const payment =
    payments.find((p: any) => p.status === PAYMENT_STATUS.PENDING) || payments[0];

  if (!payment.stripePaymentIntentId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Payment does not have a Stripe PaymentIntent'
    );
  }

  const intent = await stripe.paymentIntents.retrieve(
    payment.stripePaymentIntentId
  );

  // Only return client_secret when the intent is awaiting confirmation or action
  const statusesWithSecret = new Set([
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'processing',
  ]);

  const response: {
    bidId: string;
    paymentId?: string;
    stripePaymentIntentId?: string;
    intent_status: string;
    client_secret?: string;
  } = {
    bidId,
    paymentId: payment._id?.toString(),
    stripePaymentIntentId: intent.id,
    intent_status: intent.status,
  };

  if (statusesWithSecret.has(intent.status) && intent.client_secret) {
    response.client_secret = intent.client_secret;
  }

  return response;
};

const PaymentService = {
  createStripeAccount,
  getPaymentHistory,
  createOnboardingLink,
  checkOnboardingStatus,
  createEscrowPayment,
  releaseEscrowPayment,
  refundEscrowPayment,
  getPaymentById,
  getPayments,
  getPaymentStats,
  getUserPayments,
  getUserPaymentStats,
  handleWebhookEvent,
  getCurrentIntentByBid,
  deleteStripeAccountService,
};

export default PaymentService;
