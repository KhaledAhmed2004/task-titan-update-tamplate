import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiError';
import mongoose from 'mongoose';
import PaymentService, {
  createStripeAccount,
  createOnboardingLink,
  checkOnboardingStatus,
  refundEscrowPayment,
  getPaymentById,
  getPayments,
  getPaymentStats,
  handleWebhookEvent,
} from './payment.service';
import { IPaymentFilters } from './payment.interface';
import { JwtPayload } from 'jsonwebtoken';

// Create Stripe Connect account for freelancers
export const createStripeAccountController = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user.id;
    const { accountType } = req.body;

    if (!userId || !accountType) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'User ID and account type are required'
      );
    }

    const result = await createStripeAccount({ userId, accountType });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'Stripe account created successfully',
      data: result,
    });
  }
);

// Get onboarding link for freelancer
export const getOnboardingLinkController = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user.id;

    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
    }

    const onboardingUrl = await createOnboardingLink(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Onboarding link created successfully',
      data: {
        onboarding_url: onboardingUrl,
      },
    });
  }
);

// Check onboarding status
export const checkOnboardingStatusController = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user.id;

    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
    }

    const status = await checkOnboardingStatus(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Onboarding status retrieved successfully',
      data: status,
    });
  }
);

// Refund escrow payment
export const refundPaymentController = catchAsync(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const { reason } = req.body;

    if (!paymentId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment ID is required');
    }

    const result = await refundEscrowPayment(paymentId, reason);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: result.message,
      data: {
        refund_id: result.refund_id,
        amount_refunded: result.amount_refunded,
      },
    });
  }
);

// Get payment by ID
export const getPaymentByIdController = catchAsync(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params;

    if (!paymentId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment ID is required');
    }

    const payment = await getPaymentById(paymentId);

    if (!payment) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Payment retrieved successfully',
      data: payment,
    });
  }
);

// Get payments with filters and pagination
export const getPaymentsController = catchAsync(
  async (req: Request, res: Response) => {
    const {
      status,
      clientId,
      freelancerId,
      bidId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filters object
    const filters: IPaymentFilters = {};
    if (status) filters.status = status as any;
    if (clientId)
      filters.clientId = new mongoose.Types.ObjectId(clientId as string);
    if (freelancerId)
      filters.freelancerId = new mongoose.Types.ObjectId(
        freelancerId as string
      );
    if (bidId) filters.bidId = new mongoose.Types.ObjectId(bidId as string);
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);

    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;

    // Validate pagination parameters
    if (pageNum < 1) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Page must be greater than 0');
    }

    if (limitNum < 1 || limitNum > 100) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Limit must be between 1 and 100'
      );
    }

    const result = await getPayments(filters, pageNum, limitNum);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Payments retrieved successfully',
      data: result.payments,
      pagination: {
        page: result.currentPage,
        limit: limitNum,
        totalPage: result.totalPages,
        total: result.total,
      },
    });
  }
);

// Get payment statistics
export const getPaymentStatsController = catchAsync(
  async (req: Request, res: Response) => {
    const { clientId, freelancerId, dateFrom, dateTo } = req.query;

    // Build filters object
    const filters: IPaymentFilters = {};
    if (clientId)
      filters.clientId = new mongoose.Types.ObjectId(clientId as string);
    if (freelancerId)
      filters.freelancerId = new mongoose.Types.ObjectId(
        freelancerId as string
      );
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);

    const stats = await getPaymentStats(filters);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Payment statistics retrieved successfully',
      data: stats,
    });
  }
);

// Handle Stripe webhook
export const handleStripeWebhookController = catchAsync(
  async (req: Request, res: Response) => {
    const event = req.body;

    if (!event || !event.type) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid webhook event');
    }

    await handleWebhookEvent(event);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Webhook processed successfully',
    });
  }
);

const deleteStripeAccountController = catchAsync(async (req, res) => {
  const { accountId } = req.params;

  const deletedAccount = await PaymentService.deleteStripeAccountService(
    accountId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stripe account deleted successfully',
    data: deletedAccount,
  });
});

// Get payment history for poster, tasker, super admin
const getPaymentHistoryController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.user as JwtPayload;
    const query = req.query;

    const result = await PaymentService.getPaymentHistory(id, query);

    sendResponse(res, {
      success: result.success,
      statusCode: httpStatus.OK,
      message: result.pagination.total > 0 
        ? `Payment history retrieved successfully. Found ${result.pagination.total} payment(s).`
        : 'No payment history found for this user.',
      data: result.data,
      pagination: result.pagination,
      
    });
  }
);

const PaymentController = {
  createStripeAccountController,
  getOnboardingLinkController,
  checkOnboardingStatusController,
  refundPaymentController,
  getPaymentByIdController,
  getPaymentsController,
  getPaymentStatsController,
  handleStripeWebhookController,
  deleteStripeAccountController,
  getPaymentHistoryController,
};

export default PaymentController;
