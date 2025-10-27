import {
  IEscrowPayment,
  IPaymentRelease,
  IPayment,
  IPaymentFilters,
  PAYMENT_STATUS,
  IPaymentView,
  IPaymentStats,
} from './payment.interface';
import mongoose from 'mongoose';
import { Payment, Payment as PaymentModel } from './payment.model';
import { TaskModel } from '../task/task.model';
import { TaskStatus } from '../task/task.interface';
import { BidModel } from '../bid/bid.model';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AggregationBuilder from '../../builder/AggregationBuilder';
import {
  stripe,
  calculatePlatformFee,
  calculateFreelancerAmount,
  handleStripeError,
  DEFAULT_CURRENCY,
} from '../../../config/stripe';
import {
  createPaymentIntent as stripeCreatePaymentIntent,
  createTransfer as stripeCreateTransfer,
  createRefundForIntent as stripeCreateRefundForIntent,
} from './stripe.adapter';
import StripeConnectService from './stripeConnect.service';

// Helper to present sender/receiver aliases for readability
const mapPaymentToView = (payment: any): IPaymentView => {
  const base =
    typeof payment?.toObject === 'function' ? payment.toObject() : payment;
  return {
    ...base,
    senderId: base.posterId,
    receiverId: base.freelancerId,
  };
};

// Moved to stripeConnected.service.ts

// Moved to stripeConnected.service.ts

// Moved to stripeConnected.service.ts

// Create escrow payment when bid is accepted
// Escrow helpers (internal)
const getBidAndTask = async (bidId: any) => {
  const bid = await BidModel.findById(bidId).populate('taskId');
  if (!bid) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bid not found');
  }
  const task = bid.taskId as any;
  if (!bid.taskerId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Bid does not have an assigned freelancer'
    );
  }
  return { bid, task };
};

// Moved to stripeConnected.service.ts

const ensureNoExistingPaymentForBid = async (bidId: any) => {
  const existingPayment = await PaymentModel.getPaymentsByBid(bidId);
  if (existingPayment && existingPayment.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Payment already exists for this bid'
    );
  }
};

const buildIntentMetadata = (data: IEscrowPayment, task: any) => ({
  bid_id: data.bidId!.toString(),
  poster_id: data.posterId!.toString(),
  freelancer_id: data.freelancerId!.toString(),
  task_title: task?.title,
  type: 'escrow_payment',
});

const createEscrowIntent = async (
  amount: number,
  metadata: Record<string, any>
) => {
  return stripeCreatePaymentIntent({
    amountDollars: amount,
    currency: DEFAULT_CURRENCY,
    captureMethod: 'manual',
    metadata,
  });
};

const createPaymentRecord = async (
  data: IEscrowPayment,
  platformFee: number,
  freelancerAmount: number,
  paymentIntentId: string
): Promise<IPayment> => {
  const payment = new PaymentModel({
    taskId: data.taskId,
    bidId: data.bidId,
    posterId: data.posterId,
    freelancerId: data.freelancerId,
    amount: data.amount,
    platformFee,
    freelancerAmount,
    stripePaymentIntentId: paymentIntentId,
    status: PAYMENT_STATUS.PENDING,
    currency: DEFAULT_CURRENCY,
    metadata: data.metadata,
  });
  await payment.save();
  return payment as IPayment;
};
export const createEscrowPayment = async (
  data: IEscrowPayment
): Promise<{ payment: IPayment; client_secret: string }> => {
  try {
    // Validate required fields early
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

    const { bid, task } = await getBidAndTask(data.bidId);
    await StripeConnectService.ensureFreelancerOnboarded(bid.taskerId);
    await ensureNoExistingPaymentForBid(data.bidId);

    const platformFee = calculatePlatformFee(data.amount);
    const freelancerAmount = calculateFreelancerAmount(data.amount);

    const metadata = buildIntentMetadata(data, task);
    const paymentIntent = await createEscrowIntent(data.amount, metadata);

    const payment = await createPaymentRecord(
      data,
      platformFee,
      freelancerAmount,
      paymentIntent.id
    );

    return {
      payment,
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
// Release helpers (internal)
const getPaymentOrThrow = async (paymentId: any) => {
  const payment = await PaymentModel.isExistPaymentById(paymentId.toString());
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
  }
  return payment;
};

const ensureHeldStatus = (payment: any) => {
  if (payment.status !== PAYMENT_STATUS.HELD) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Payment is not in held status. Current status: ${payment.status}`
    );
  }
};

const ensureClientAuthorized = async (taskId: any, clientId: any) => {
  const task = await TaskModel.findById(taskId);
  if (!task || task.userId.toString() !== clientId?.toString()) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You are not authorized to release this payment'
    );
  }
};

const getChargeIdForIntent = async (
  intentId: string
): Promise<{ chargeId?: string; canTransferWithoutSource: boolean }> => {
  const paymentIntent = await stripe.paymentIntents.retrieve(intentId, {
    expand: ['latest_charge'],
  });

  let chargeId: string | undefined;
  const latestCharge: any = (paymentIntent as any).latest_charge;
  if (typeof latestCharge === 'string') {
    chargeId = latestCharge;
  } else if (latestCharge && latestCharge.id) {
    chargeId = latestCharge.id;
  }

  if (!chargeId) {
    const chargeList = await stripe.charges.list({
      payment_intent: intentId,
      limit: 1,
    });
    if (chargeList.data && chargeList.data.length > 0) {
      chargeId = chargeList.data[0].id;
    }
  }

  return { chargeId, canTransferWithoutSource: !chargeId };
};

// Moved to stripeConnected.service.ts

const createTransferToFreelancer = async (
  amount: number,
  currency: string,
  destination: string,
  sourceChargeId?: string,
  metadata?: Record<string, any>
) => {
  return stripeCreateTransfer({
    amountDollars: amount,
    currency,
    destinationAccountId: destination,
    sourceChargeId,
    metadata,
  });
};

const markPaymentReleasedAndBidCompleted = async (
  paymentId: any,
  bidId: any
) => {
  await PaymentModel.updatePaymentStatus(paymentId, PAYMENT_STATUS.RELEASED);
  await BidModel.findByIdAndUpdate(bidId, { status: 'completed' });
};
export const releaseEscrowPayment = async (
  data: IPaymentRelease
): Promise<{
  success: boolean;
  message: string;
  freelancer_amount: number;
  platform_fee: number;
}> => {
  try {
    const payment = await getPaymentOrThrow(data.paymentId);

    ensureHeldStatus(payment);

    await ensureClientAuthorized(payment.taskId, data.clientId);

    const { chargeId } = await getChargeIdForIntent(
      payment.stripePaymentIntentId
    );

    const freelancerStripeAccount = await StripeConnectService.getFreelancerAccountOrThrow(
      payment.freelancerId
    );

    await createTransferToFreelancer(
      payment.freelancerAmount,
      payment.currency || DEFAULT_CURRENCY,
      freelancerStripeAccount.stripeAccountId,
      chargeId,
      {
        bid_id: payment.bidId?.toString?.() || String(payment.bidId),
        payment_id: payment._id?.toString?.() || String(payment._id),
        intent_id: payment.stripePaymentIntentId,
        type: 'escrow_release_transfer',
      }
    );

    await markPaymentReleasedAndBidCompleted(data.paymentId, payment.bidId);

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
// Refund helpers (internal)
const ensureRefundable = (payment: any) => {
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
};

const createRefundForIntent = async (intentId: string, reason?: string) => {
  return stripeCreateRefundForIntent(intentId, reason);
};

const markPaymentRefunded = async (paymentId: any, reason?: string) => {
  await PaymentModel.updatePaymentStatus(
    new mongoose.Types.ObjectId(paymentId),
    PAYMENT_STATUS.REFUNDED
  );
  if (reason) {
    await PaymentModel.findByIdAndUpdate(paymentId, {
      refundReason: reason,
    });
  }
};
export const refundEscrowPayment = async (
  paymentId: string,
  reason?: string
): Promise<any> => {
  try {
    const payment = await PaymentModel.isExistPaymentById(paymentId);

    if (!payment) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    ensureRefundable(payment);

    const refund = await createRefundForIntent(
      payment.stripePaymentIntentId,
      reason
    );

    await markPaymentRefunded(paymentId, reason);

    await BidModel.findByIdAndUpdate(payment.bidId, {
      status: 'cancelled',
    });

    return {
      success: true,
      message: 'Payment refunded successfully',
      refund_id: refund.id,
      amount_refunded: refund.amount / 100,
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
): Promise<IPaymentView | null> => {
  try {
    const payment = await PaymentModel.isExistPaymentById(paymentId);

    return payment ? mapPaymentToView(payment) : null;
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
  payments: IPaymentView[];
  total: number;
  totalPages: number;
  currentPage: number;
}> => {
  try {
    // Validate and normalize pagination
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    if (pageNum < 1) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Page must be greater than 0');
    }

    if (limitNum < 1 || limitNum > 100) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Limit must be between 1 and 100'
      );
    }

    // Build query object compatible with PaymentModel fields
    const queryObj: Record<string, unknown> = {};

    if (filters.status) queryObj.status = filters.status;
    if (filters.clientId) queryObj.posterId = filters.clientId;
    if (filters.freelancerId) queryObj.freelancerId = filters.freelancerId;
    if (filters.bidId) queryObj.bidId = filters.bidId;

    if (filters.dateFrom || filters.dateTo) {
      const createdAt: any = {};
      if (filters.dateFrom) createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) createdAt.$lte = filters.dateTo;
      queryObj.createdAt = createdAt;
    }

    // Use QueryBuilder for filter/sort/pagination
    const qb = new QueryBuilder<IPayment>(PaymentModel.find(), {
      ...queryObj,
      page: pageNum,
      limit: limitNum,
    })
      .filter()
      .sort() // default '-createdAt'
      .paginate();

    // Deep populate bid -> task and tasker
    qb.modelQuery = qb.modelQuery.populate({
      path: 'bidId',
      populate: [
        { path: 'taskId', select: 'title' },
        { path: 'taskerId', select: 'name email' },
      ],
    });

    const payments = await qb.modelQuery;
    const pageInfo = await qb.getPaginationInfo();

    return {
      payments: payments.map(mapPaymentToView),
      total: pageInfo.total,
      totalPages: pageInfo.totalPage,
      currentPage: pageInfo.page,
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

// Payment stats overview (growth metrics similar to Task stats)
export const getPaymentStatsOverview = async () => {
  const builder = new AggregationBuilder(PaymentModel);

  const allPayments = await builder.calculateGrowth({ period: 'month' });

  const released = await builder.calculateGrowth({
    filter: { status: PAYMENT_STATUS.RELEASED },
    period: 'month',
  });

  const pending = await builder.calculateGrowth({
    filter: { status: PAYMENT_STATUS.PENDING },
    period: 'month',
  });

  const refunded = await builder.calculateGrowth({
    filter: { status: PAYMENT_STATUS.REFUNDED },
    period: 'month',
  });

  return {
    allPayments,
    released,
    pending,
    refunded,
  };
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
      await StripeConnectService.handleAccountUpdated(event.data.object);
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
    console.log(
      `Payment ${paymentIntent.id} succeeded; status set to HELD. No duplicate acceptance triggered.`
    );
  } catch (error) {
    console.error(
      `Error in handlePaymentSucceeded for payment ${paymentIntent.id}:`,
      error
    );
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
        const assignedMatches =
          task.assignedTo?.toString() === bid.taskerId?.toString();
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
    console.error(
      'Failed to revert task state after payment failure:',
      revertErr
    );
  }
};

// Moved to stripeConnected.service.ts

// Handle amount capturable updated webhook (manual capture flow)
const handleAmountCapturableUpdated = async (
  paymentIntent: any
): Promise<void> => {
  const bidId = paymentIntent.metadata?.bid_id;

  try {
    if (!bidId) {
      console.error(
        '❌ No bid_id in payment intent metadata for amount_capturable_updated:',
        paymentIntent.metadata
      );
      return;
    }

    // console.log(`Payment ${paymentIntent.id} is now capturable, capturing to hold funds on platform...`);

    try {
      // Capture the payment on the platform account (no transfer_data configured)
      const capturedPayment = await stripe.paymentIntents.capture(
        paymentIntent.id
      );
      // console.log(`Payment ${paymentIntent.id} captured successfully (amount_capturable_updated handler)`);

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
      console.error(
        `Failed to capture payment ${paymentIntent.id} in amount_capturable_updated handler:`,
        captureError
      );
      if (
        captureError.message &&
        captureError.message.includes('already been captured')
      ) {
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
      // console.log(`Bid ${bidId} acceptance completed after capture (amount_capturable_updated).`);
    } catch (error) {
      console.error('Failed to complete bid acceptance after capture:', error);
    }
  } catch (error) {
    console.error(
      `Error in handleAmountCapturableUpdated for payment ${paymentIntent.id}:`,
      error
    );
  }
};

// Get user payments (for user-specific routes)
export const getUserPayments = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  payments: IPaymentView[];
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
      payments: paginatedPayments.map(mapPaymentToView),
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

// Get user payment statistics (direct aggregation)
export const getUserPaymentStats = async (
  userId: string
): Promise<IPaymentStats> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const matchStage = {
      $or: [{ posterId: userObjectId }, { freelancerId: userObjectId }],
    };

    const [totalStats, statusBreakdown, monthlyTrend] = await Promise.all([
      PaymentModel.aggregate([
        { $match: matchStage },
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
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      PaymentModel.aggregate([
        { $match: matchStage },
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
      `Failed to get user payment stats: ${errorMessage}`
    );
  }
};

// Moved to stripeConnected.service.ts

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
    const formattedPayments = payments.map(payment => ({
      paymentId: payment.stripePaymentIntentId,
      taskerName: payment.freelancerId
        ? (payment.freelancerId as any).name
        : 'N/A',
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
    throw new ApiError(httpStatus.NOT_FOUND, 'No payment found for this bid');
  }

  // Prefer pending payment; otherwise take the most recent
  const payment =
    payments.find((p: any) => p.status === PAYMENT_STATUS.PENDING) ||
    payments[0];

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
  getPaymentHistory,
  createEscrowPayment,
  releaseEscrowPayment,
  refundEscrowPayment,
  getPaymentById,
  getPayments,
  getPaymentStatsOverview,
  getUserPayments,
  getUserPaymentStats,
  handleWebhookEvent,
  getCurrentIntentByBid,
};

export default PaymentService;
