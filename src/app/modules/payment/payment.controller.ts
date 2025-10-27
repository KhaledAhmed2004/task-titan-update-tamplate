import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiError';
import mongoose from 'mongoose';
import PaymentService, {
  refundEscrowPayment,
  getPaymentById,
  getPayments,
  getPaymentStatsOverview,
  getCurrentIntentByBid,
} from './payment.service';
import { IPaymentFilters } from './payment.interface';
import { JwtPayload } from 'jsonwebtoken';
import { deleteStripeAccountService } from './stripeConnect.service';

// Get current intent (and client_secret if applicable) by bidId
export const getCurrentIntentByBidController = catchAsync(
  async (req: Request, res: Response) => {
    const { bidId } = req.params;

    if (!bidId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Bid ID is required');
    }

    const result = await getCurrentIntentByBid(bidId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: result.client_secret
        ? 'Current intent retrieved with client_secret'
        : 'Current intent retrieved (no client_secret needed)',
      data: result,
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

    const result = await getPayments(filters, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Payments retrieved successfully',
      data: result.payments,
      pagination: {
        page: result.currentPage,
        limit: Number(limit) || 10,
        totalPage: result.totalPages,
        total: result.total,
      },
    });
  }
);

// Get payment statistics
export const getPaymentStatsController = catchAsync(
  async (_req: Request, res: Response) => {
    const stats = await getPaymentStatsOverview();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Payment stats overview retrieved successfully',
      data: stats,
    });
  }
);

const deleteStripeAccountController = catchAsync(async (req, res) => {
  const { accountId } = req.params;

  const deletedAccount = await deleteStripeAccountService(
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
      message:
        result.pagination.total > 0
          ? `Payment history retrieved successfully. Found ${result.pagination.total} payment(s).`
          : 'No payment history found for this user.',
      data: result.data,
      pagination: result.pagination,
    });
  }
);

const PaymentController = {
  refundPaymentController,
  getPaymentByIdController,
  getPaymentsController,
  getPaymentStatsController,
  deleteStripeAccountController,
  getPaymentHistoryController,
  getCurrentIntentByBidController,
};

export default PaymentController;
