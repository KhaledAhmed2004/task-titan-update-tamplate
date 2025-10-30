"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentStatsController = exports.getPaymentsController = exports.getPaymentByIdController = exports.refundPaymentController = exports.getCurrentIntentByBidController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const mongoose_1 = __importDefault(require("mongoose"));
const payment_service_1 = __importStar(require("./payment.service"));
const stripeConnect_service_1 = require("./stripeConnect.service");
// Get current intent (and client_secret if applicable) by bidId
exports.getCurrentIntentByBidController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bidId } = req.params;
    if (!bidId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Bid ID is required');
    }
    const result = yield (0, payment_service_1.getCurrentIntentByBid)(bidId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: result.client_secret
            ? 'Current intent retrieved with client_secret'
            : 'Current intent retrieved (no client_secret needed)',
        data: result,
    });
}));
// Refund escrow payment
exports.refundPaymentController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { paymentId } = req.params;
    const { reason } = req.body;
    if (!paymentId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Payment ID is required');
    }
    const result = yield (0, payment_service_1.refundEscrowPayment)(paymentId, reason);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: result.message,
        data: {
            refund_id: result.refund_id,
            amount_refunded: result.amount_refunded,
        },
    });
}));
// Get payment by ID
exports.getPaymentByIdController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { paymentId } = req.params;
    if (!paymentId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Payment ID is required');
    }
    const payment = yield (0, payment_service_1.getPaymentById)(paymentId);
    if (!payment) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Payment not found');
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Payment retrieved successfully',
        data: payment,
    });
}));
// Get payments with filters and pagination
exports.getPaymentsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, clientId, freelancerId, bidId, dateFrom, dateTo, page = 1, limit = 10, } = req.query;
    // Build filters object
    const filters = {};
    if (status)
        filters.status = status;
    if (clientId)
        filters.clientId = new mongoose_1.default.Types.ObjectId(clientId);
    if (freelancerId)
        filters.freelancerId = new mongoose_1.default.Types.ObjectId(freelancerId);
    if (bidId)
        filters.bidId = new mongoose_1.default.Types.ObjectId(bidId);
    if (dateFrom)
        filters.dateFrom = new Date(dateFrom);
    if (dateTo)
        filters.dateTo = new Date(dateTo);
    const result = yield (0, payment_service_1.getPayments)(filters, {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Payments retrieved successfully',
        data: result.payments,
        pagination: {
            page: result.currentPage,
            limit: Number(limit) || 10,
            totalPage: result.totalPages,
            total: result.total,
        },
    });
}));
// Get payment statistics
exports.getPaymentStatsController = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield (0, payment_service_1.getPaymentStatsOverview)();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Payment stats overview retrieved successfully',
        data: stats,
    });
}));
const deleteStripeAccountController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { accountId } = req.params;
    const deletedAccount = yield (0, stripeConnect_service_1.deleteStripeAccountService)(accountId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Stripe account deleted successfully',
        data: deletedAccount,
    });
}));
// Get payment history for poster, tasker, super admin
const getPaymentHistoryController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const query = req.query;
    const result = yield payment_service_1.default.getPaymentHistory(id, query);
    (0, sendResponse_1.default)(res, {
        success: result.success,
        statusCode: http_status_1.default.OK,
        message: result.pagination.total > 0
            ? `Payment history retrieved successfully. Found ${result.pagination.total} payment(s).`
            : 'No payment history found for this user.',
        data: result.data,
        pagination: result.pagination,
    });
}));
const PaymentController = {
    refundPaymentController: exports.refundPaymentController,
    getPaymentByIdController: exports.getPaymentByIdController,
    getPaymentsController: exports.getPaymentsController,
    getPaymentStatsController: exports.getPaymentStatsController,
    deleteStripeAccountController,
    getPaymentHistoryController,
    getCurrentIntentByBidController: exports.getCurrentIntentByBidController,
};
exports.default = PaymentController;
