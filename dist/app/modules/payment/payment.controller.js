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
exports.handleStripeWebhookController = exports.getPaymentStatsController = exports.getPaymentsController = exports.getPaymentByIdController = exports.refundPaymentController = exports.checkOnboardingStatusController = exports.getOnboardingLinkController = exports.createStripeAccountController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const mongoose_1 = __importDefault(require("mongoose"));
const payment_service_1 = __importStar(require("./payment.service"));
// Create Stripe Connect account for freelancers
exports.createStripeAccountController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user.id;
    const { accountType } = req.body;
    if (!userId || !accountType) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'User ID and account type are required');
    }
    const result = yield (0, payment_service_1.createStripeAccount)({ userId, accountType });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: 'Stripe account created successfully',
        data: result,
    });
}));
// Get onboarding link for freelancer
exports.getOnboardingLinkController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user.id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'User ID is required');
    }
    const onboardingUrl = yield (0, payment_service_1.createOnboardingLink)(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Onboarding link created successfully',
        data: {
            onboarding_url: onboardingUrl,
        },
    });
}));
// Check onboarding status
exports.checkOnboardingStatusController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user.id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'User ID is required');
    }
    const status = yield (0, payment_service_1.checkOnboardingStatus)(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Onboarding status retrieved successfully',
        data: status,
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
    // Parse pagination parameters
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    // Validate pagination parameters
    if (pageNum < 1) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Page must be greater than 0');
    }
    if (limitNum < 1 || limitNum > 100) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Limit must be between 1 and 100');
    }
    const result = yield (0, payment_service_1.getPayments)(filters, pageNum, limitNum);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Payments retrieved successfully',
        data: result.payments,
        pagination: {
            page: result.currentPage,
            limit: limitNum,
            totalPage: result.totalPages,
            total: result.total,
        },
    });
}));
// Get payment statistics
exports.getPaymentStatsController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientId, freelancerId, dateFrom, dateTo } = req.query;
    // Build filters object
    const filters = {};
    if (clientId)
        filters.clientId = new mongoose_1.default.Types.ObjectId(clientId);
    if (freelancerId)
        filters.freelancerId = new mongoose_1.default.Types.ObjectId(freelancerId);
    if (dateFrom)
        filters.dateFrom = new Date(dateFrom);
    if (dateTo)
        filters.dateTo = new Date(dateTo);
    const stats = yield (0, payment_service_1.getPaymentStats)(filters);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Payment statistics retrieved successfully',
        data: stats,
    });
}));
// Handle Stripe webhook
exports.handleStripeWebhookController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const event = req.body;
    if (!event || !event.type) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid webhook event');
    }
    yield (0, payment_service_1.handleWebhookEvent)(event);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Webhook processed successfully',
    });
}));
const deleteStripeAccountController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { accountId } = req.params;
    const deletedAccount = yield payment_service_1.default.deleteStripeAccountService(accountId);
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
    createStripeAccountController: exports.createStripeAccountController,
    getOnboardingLinkController: exports.getOnboardingLinkController,
    checkOnboardingStatusController: exports.checkOnboardingStatusController,
    refundPaymentController: exports.refundPaymentController,
    getPaymentByIdController: exports.getPaymentByIdController,
    getPaymentsController: exports.getPaymentsController,
    getPaymentStatsController: exports.getPaymentStatsController,
    handleStripeWebhookController: exports.handleStripeWebhookController,
    deleteStripeAccountController,
    getPaymentHistoryController,
};
exports.default = PaymentController;
