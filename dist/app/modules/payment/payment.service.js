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
exports.getCurrentIntentByBid = exports.getUserPaymentStats = exports.getUserPayments = exports.handleWebhookEvent = exports.getPaymentStats = exports.getPayments = exports.getPaymentById = exports.refundEscrowPayment = exports.releaseEscrowPayment = exports.createEscrowPayment = exports.checkOnboardingStatus = exports.createOnboardingLink = exports.createStripeAccount = void 0;
const payment_interface_1 = require("./payment.interface");
const mongoose_1 = __importDefault(require("mongoose"));
const payment_model_1 = require("./payment.model");
const user_model_1 = require("../user/user.model");
const task_model_1 = require("../task/task.model");
const bid_model_1 = require("../bid/bid.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const stripe_1 = require("../../../config/stripe");
// Create Stripe Connect account for freelancers
const createStripeAccount = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get user details
        const user = yield user_model_1.User.findById(data.userId).select('name email phone dateOfBirth location');
        if (!user) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
        }
        // Check if user already has a Stripe account
        const existingAccount = yield payment_model_1.StripeAccount.isExistAccountByUserId(data.userId);
        if (existingAccount) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'User already has a Stripe account');
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
        const account = yield stripe_1.stripe.accounts.create({
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
        const stripeAccount = new payment_model_1.StripeAccount({
            userId: data.userId,
            stripeAccountId: account.id,
            onboardingCompleted: false,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            country: account.country,
            currency: account.default_currency || 'usd',
            businessType: account.business_type || 'individual',
        });
        yield stripeAccount.save();
        return {
            account_id: account.id,
            onboarding_required: !account.charges_enabled,
            database_record: stripeAccount,
        };
    }
    catch (error) {
        if (error instanceof ApiError_1.default)
            throw error;
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to create Stripe account: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.createStripeAccount = createStripeAccount;
// Create onboarding link for freelancer
const createOnboardingLink = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        const stripeAccount = yield payment_model_1.StripeAccount.isExistAccountByUserId(userObjectId);
        if (!stripeAccount) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Stripe account not found. Please create an account first.');
        }
        if (stripeAccount.onboardingCompleted) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'User has already completed onboarding');
        }
        const accountLink = yield stripe_1.stripe.accountLinks.create({
            account: stripeAccount.stripeAccountId,
            refresh_url: `${process.env.FRONTEND_URL}/onboarding/refresh`,
            return_url: `${process.env.FRONTEND_URL}/onboarding/complete`,
            type: 'account_onboarding',
        });
        return accountLink.url;
    }
    catch (error) {
        if (error instanceof ApiError_1.default)
            throw error;
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to create onboarding link: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.createOnboardingLink = createOnboardingLink;
// Check if freelancer has completed Stripe onboarding
const checkOnboardingStatus = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        const stripeAccount = yield payment_model_1.StripeAccount.isExistAccountByUserId(userObjectId);
        if (!stripeAccount) {
            return { completed: false };
        }
        // Check with Stripe for latest status
        const account = yield stripe_1.stripe.accounts.retrieve(stripeAccount.stripeAccountId);
        console.log(account);
        const completed = account.charges_enabled && account.payouts_enabled;
        const currentlyDue = (_a = account === null || account === void 0 ? void 0 : account.requirements) === null || _a === void 0 ? void 0 : _a.currently_due; // Array of missing fields
        // Update local status if changed
        if (completed !== stripeAccount.onboardingCompleted) {
            yield payment_model_1.StripeAccount.updateAccountStatus(stripeAccount.userId, {
                onboardingCompleted: completed,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
            });
        }
        return {
            completed,
            account_id: stripeAccount.stripeAccountId,
            // missing_fields: currentlyDue,
            missing_fields: currentlyDue !== null && currentlyDue !== void 0 ? currentlyDue : undefined,
        };
    }
    catch (error) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to check onboarding status: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.checkOnboardingStatus = checkOnboardingStatus;
// Create escrow payment when bid is accepted
const createEscrowPayment = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate bid exists and get details
        const bid = yield bid_model_1.BidModel.findById(data.bidId).populate('taskId');
        if (!bid) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Bid not found');
        }
        const task = bid.taskId;
        // if (task.userId !== data.posterId) {
        //   throw new ApiError(
        //     httpStatus.FORBIDDEN,
        //     'You are not authorized to accept this bid'
        //   );
        // }
        // Check freelancer's Stripe account
        if (!bid.taskerId) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Bid does not have an assigned freelancer');
        }
        const freelancerStripeAccount = yield payment_model_1.StripeAccount.isExistAccountByUserId(bid.taskerId);
        if (!freelancerStripeAccount ||
            !freelancerStripeAccount.onboardingCompleted) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Freelancer has not completed Stripe onboarding');
        }
        // Check if payment already exists for this bid
        if (!data.bidId) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Bid ID is required for escrow payment');
        }
        if (!data.posterId) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Poster ID is required for escrow payment');
        }
        const existingPayment = yield payment_model_1.Payment.getPaymentsByBid(data.bidId);
        if (existingPayment && existingPayment.length > 0) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Payment already exists for this bid');
        }
        const platformFee = (0, stripe_1.calculatePlatformFee)(data.amount);
        const freelancerAmount = (0, stripe_1.calculateFreelancerAmount)(data.amount);
        // Create payment intent with application fee
        const paymentIntent = yield stripe_1.stripe.paymentIntents.create({
            amount: (0, stripe_1.dollarsToCents)(data.amount),
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            application_fee_amount: (0, stripe_1.dollarsToCents)(platformFee),
            transfer_data: {
                destination: freelancerStripeAccount.stripeAccountId,
            },
            capture_method: 'manual', // Hold the payment until task completion
            metadata: {
                bid_id: data.bidId.toString(),
                poster_id: data.posterId.toString(),
                freelancer_id: data.freelancerId.toString(),
                task_title: task.title,
                type: 'escrow_payment',
            },
        });
        // Create payment record in database
        const payment = new payment_model_1.Payment({
            taskId: data.taskId,
            bidId: data.bidId,
            // posterId: data.clientId,
            posterId: data.posterId,
            freelancerId: data.freelancerId,
            amount: data.amount,
            platformFee: platformFee,
            freelancerAmount: freelancerAmount,
            stripePaymentIntentId: paymentIntent.id,
            status: payment_interface_1.PAYMENT_STATUS.PENDING,
            currency: 'usd',
            metadata: data.metadata,
        });
        yield payment.save();
        return {
            payment: payment,
            client_secret: paymentIntent.client_secret,
        };
    }
    catch (error) {
        if (error instanceof ApiError_1.default)
            throw error;
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to create escrow payment: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.createEscrowPayment = createEscrowPayment;
// Release payment when task is completed and approved
const releaseEscrowPayment = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const payment = yield payment_model_1.Payment.isExistPaymentById(data.paymentId.toString());
        if (!payment) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Payment not found');
        }
        if (payment.status !== payment_interface_1.PAYMENT_STATUS.HELD) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Payment is not in held status. Current status: ${payment.status}`);
        }
        // Verify authorization - check if the client is the poster of the task
        const task = yield task_model_1.TaskModel.findById(payment.taskId);
        if (!task || task.userId.toString() !== ((_a = data.clientId) === null || _a === void 0 ? void 0 : _a.toString())) {
            throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized to release this payment');
        }
        // Check current payment intent status and capture if needed
        let paymentIntent = yield stripe_1.stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
        // Only capture if it requires capture
        if (paymentIntent.status === 'requires_capture') {
            try {
                paymentIntent = yield stripe_1.stripe.paymentIntents.capture(payment.stripePaymentIntentId);
            }
            catch (captureError) {
                // Handle already captured error
                if (captureError.message &&
                    captureError.message.includes('already been captured')) {
                    // Retrieve the current status
                    paymentIntent = yield stripe_1.stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
                }
                else {
                    throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to capture payment: ${captureError.message}`);
                }
            }
        }
        // Verify payment is successful
        if (paymentIntent.status !== 'succeeded') {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Payment is not in succeeded status. Current status: ${paymentIntent.status}`);
        }
        // Update payment status
        yield payment_model_1.Payment.updatePaymentStatus(data.paymentId, payment_interface_1.PAYMENT_STATUS.RELEASED);
        // Update bid status to completed
        yield bid_model_1.BidModel.findByIdAndUpdate(payment.bidId, {
            status: 'completed',
        });
        return {
            success: true,
            message: 'Payment released successfully',
            freelancer_amount: payment.freelancerAmount,
            platform_fee: payment.platformFee,
        };
    }
    catch (error) {
        if (error instanceof ApiError_1.default)
            throw error;
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to release payment: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.releaseEscrowPayment = releaseEscrowPayment;
// Refund escrow payment
const refundEscrowPayment = (paymentId, reason) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payment = yield payment_model_1.Payment.isExistPaymentById(paymentId);
        if (!payment) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Payment not found');
        }
        if (payment.status === payment_interface_1.PAYMENT_STATUS.REFUNDED) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Payment has already been refunded');
        }
        if (payment.status === payment_interface_1.PAYMENT_STATUS.RELEASED) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Cannot refund a payment that has already been released');
        }
        // Create refund in Stripe
        const refund = yield stripe_1.stripe.refunds.create({
            payment_intent: payment.stripePaymentIntentId,
            reason: 'requested_by_customer',
            metadata: {
                payment_id: paymentId,
                refund_reason: reason || 'No reason provided',
            },
        });
        // Update payment status
        yield payment_model_1.Payment.updatePaymentStatus(new mongoose_1.default.Types.ObjectId(paymentId), payment_interface_1.PAYMENT_STATUS.REFUNDED);
        // Update refund reason if provided
        if (reason) {
            yield payment_model_1.Payment.findByIdAndUpdate(paymentId, {
                refundReason: reason,
            });
        }
        // Update bid status
        yield bid_model_1.BidModel.findByIdAndUpdate(payment.bidId, {
            status: 'cancelled',
        });
        return {
            success: true,
            refund_id: refund.id,
            amount_refunded: refund.amount / 100, // Convert cents to dollars
            message: 'Payment refunded successfully',
        };
    }
    catch (error) {
        if (error instanceof ApiError_1.default)
            throw error;
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to refund payment: ${(0, stripe_1.handleStripeError)(error)}`);
    }
});
exports.refundEscrowPayment = refundEscrowPayment;
// Get payment by ID
const getPaymentById = (paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payment = yield payment_model_1.Payment.isExistPaymentById(paymentId);
        return payment;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to get payment: ${errorMessage}`);
    }
});
exports.getPaymentById = getPaymentById;
// Get payments with filters and pagination
const getPayments = (filters_1, ...args_1) => __awaiter(void 0, [filters_1, ...args_1], void 0, function* (filters, page = 1, limit = 10) {
    try {
        const where = {};
        if (filters.status)
            where.status = filters.status;
        if (filters.clientId)
            where.posterId = filters.clientId;
        if (filters.freelancerId)
            where.freelancerId = filters.freelancerId;
        if (filters.bidId)
            where.bidId = filters.bidId;
        if (filters.dateFrom || filters.dateTo) {
            where.createdAt = {};
            if (filters.dateFrom)
                where.createdAt.$gte = filters.dateFrom;
            if (filters.dateTo)
                where.createdAt.$lte = filters.dateTo;
        }
        const skip = (page - 1) * limit;
        const [payments, total] = yield Promise.all([
            payment_model_1.Payment.find(where)
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
            payment_model_1.Payment.countDocuments(where),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            payments: payments,
            total,
            totalPages,
            currentPage: page,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to get payments: ${errorMessage}`);
    }
});
exports.getPayments = getPayments;
// Get payment statistics
const getPaymentStats = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const where = {};
        if (filters === null || filters === void 0 ? void 0 : filters.clientId)
            where.posterId = filters.clientId;
        if (filters === null || filters === void 0 ? void 0 : filters.freelancerId)
            where.freelancerId = filters.freelancerId;
        if ((filters === null || filters === void 0 ? void 0 : filters.dateFrom) || (filters === null || filters === void 0 ? void 0 : filters.dateTo)) {
            where.createdAt = {};
            if (filters.dateFrom)
                where.createdAt.$gte = filters.dateFrom;
            if (filters.dateTo)
                where.createdAt.$lte = filters.dateTo;
        }
        const [totalStats, statusBreakdown, monthlyTrend] = yield Promise.all([
            payment_model_1.Payment.aggregate([
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
            payment_model_1.Payment.aggregate([
                { $match: where },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),
            payment_model_1.Payment.aggregate([
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
        const statusBreakdownObj = {};
        statusBreakdown.forEach((item) => {
            statusBreakdownObj[item._id] = item.count;
        });
        const monthlyTrendFormatted = monthlyTrend.map((item) => ({
            month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            totalAmount: item.totalAmount,
            paymentCount: item.paymentCount,
        }));
        return {
            totalPayments: stats.totalPayments,
            totalAmount: stats.totalAmount,
            totalPlatformFees: stats.totalPlatformFees,
            totalFreelancerPayouts: stats.totalFreelancerPayouts,
            pendingPayments: statusBreakdownObj[payment_interface_1.PAYMENT_STATUS.PENDING] || 0,
            completedPayments: statusBreakdownObj[payment_interface_1.PAYMENT_STATUS.RELEASED] || 0,
            refundedPayments: statusBreakdownObj[payment_interface_1.PAYMENT_STATUS.REFUNDED] || 0,
            averagePayment: stats.averagePayment,
            statusBreakdown: statusBreakdownObj,
            monthlyTrend: monthlyTrendFormatted,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to get payment stats: ${errorMessage}`);
    }
});
exports.getPaymentStats = getPaymentStats;
// Handle Stripe webhook events
const handleWebhookEvent = (event) => __awaiter(void 0, void 0, void 0, function* () {
    switch (event.type) {
        case 'payment_intent.succeeded':
            yield handlePaymentSucceeded(event.data.object);
            break;
        case 'payment_intent.payment_failed':
            yield handlePaymentFailed(event.data.object);
            break;
        case 'account.updated':
            yield handleAccountUpdated(event.data.object);
            break;
        case 'payment_intent.amount_capturable_updated':
            yield handleAmountCapturableUpdated(event.data.object);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
});
exports.handleWebhookEvent = handleWebhookEvent;
// Handle payment succeeded webhook
const handlePaymentSucceeded = (paymentIntent) => __awaiter(void 0, void 0, void 0, function* () {
    const bidId = paymentIntent.metadata.bid_id;
    try {
        // Check if payment needs to be captured (for manual capture method)
        if (paymentIntent.status === 'requires_capture') {
            console.log(`Payment ${paymentIntent.id} requires capture, capturing now...`);
            try {
                // Capture the payment
                const capturedPayment = yield stripe_1.stripe.paymentIntents.capture(paymentIntent.id);
                console.log(`Payment ${paymentIntent.id} captured successfully`);
                // Update payment status to HELD after successful capture
                yield payment_model_1.Payment.updateMany({
                    bidId: bidId,
                    stripePaymentIntentId: paymentIntent.id,
                }, {
                    status: payment_interface_1.PAYMENT_STATUS.HELD,
                });
            }
            catch (captureError) {
                console.error(`Failed to capture payment ${paymentIntent.id}:`, captureError);
                // If already captured, just update status
                if (captureError.message && captureError.message.includes('already been captured')) {
                    console.log(`Payment ${paymentIntent.id} was already captured`);
                    yield payment_model_1.Payment.updateMany({
                        bidId: bidId,
                        stripePaymentIntentId: paymentIntent.id,
                    }, {
                        status: payment_interface_1.PAYMENT_STATUS.HELD,
                    });
                }
                else {
                    throw captureError;
                }
            }
        }
        else if (paymentIntent.status === 'succeeded') {
            // Payment is already succeeded, just update status
            console.log(`Payment ${paymentIntent.id} already succeeded`);
            yield payment_model_1.Payment.updateMany({
                bidId: bidId,
                stripePaymentIntentId: paymentIntent.id,
            }, {
                status: payment_interface_1.PAYMENT_STATUS.HELD,
            });
        }
        // Import BidService to complete bid acceptance
        const { BidService } = yield Promise.resolve().then(() => __importStar(require('../bid/bid.service')));
        try {
            // Complete the bid acceptance process now that payment is confirmed
            yield BidService.completeBidAcceptance(bidId);
            console.log(`Bid ${bidId} acceptance completed successfully`);
        }
        catch (error) {
            console.error('Failed to complete bid acceptance after payment success:', error);
            // Don't throw error here as payment is already successful
            // Log for manual intervention if needed
        }
    }
    catch (error) {
        console.error(`Error in handlePaymentSucceeded for payment ${paymentIntent.id}:`, error);
        // Don't throw error to prevent webhook retry loops
    }
});
// Handle payment failed webhook
const handlePaymentFailed = (paymentIntent) => __awaiter(void 0, void 0, void 0, function* () {
    const bidId = paymentIntent.metadata.bid_id;
    // Update payment status to REFUNDED
    yield payment_model_1.Payment.updateMany({
        bidId: bidId,
        stripePaymentIntentId: paymentIntent.id,
    }, {
        status: payment_interface_1.PAYMENT_STATUS.REFUNDED,
    });
    // Reset bid status back to PENDING so it can be re-attempted
    yield bid_model_1.BidModel.findByIdAndUpdate(bidId, {
        status: 'pending',
        paymentIntentId: null, // Clear the failed payment intent
    });
});
// Handle account updated webhook
const handleAccountUpdated = (account) => __awaiter(void 0, void 0, void 0, function* () {
    const completed = account.charges_enabled && account.payouts_enabled;
    yield payment_model_1.StripeAccount.updateMany({
        stripeAccountId: account.id,
    }, {
        onboardingCompleted: completed,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
    });
});
// Handle amount capturable updated webhook (manual capture flow)
const handleAmountCapturableUpdated = (paymentIntent) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const bidId = (_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.bid_id;
    try {
        if (!bidId) {
            console.error('❌ No bid_id in payment intent metadata for amount_capturable_updated:', paymentIntent.metadata);
            return;
        }
        console.log(`Payment ${paymentIntent.id} is now capturable, attempting capture...`);
        try {
            // Capture the payment
            const capturedPayment = yield stripe_1.stripe.paymentIntents.capture(paymentIntent.id);
            console.log(`Payment ${paymentIntent.id} captured successfully (amount_capturable_updated handler)`);
            // Update payment status to HELD after successful capture
            yield payment_model_1.Payment.updateMany({
                bidId: bidId,
                stripePaymentIntentId: paymentIntent.id,
            }, {
                status: payment_interface_1.PAYMENT_STATUS.HELD,
            });
        }
        catch (captureError) {
            console.error(`Failed to capture payment ${paymentIntent.id} in amount_capturable_updated handler:`, captureError);
            if (captureError.message && captureError.message.includes('already been captured')) {
                console.log(`Payment ${paymentIntent.id} was already captured`);
                yield payment_model_1.Payment.updateMany({
                    bidId: bidId,
                    stripePaymentIntentId: paymentIntent.id,
                }, {
                    status: payment_interface_1.PAYMENT_STATUS.HELD,
                });
            }
            else {
                // Do not throw to avoid Stripe retry storms; log for manual intervention
                return;
            }
        }
        // Complete bid acceptance process
        const { BidService } = yield Promise.resolve().then(() => __importStar(require('../bid/bid.service')));
        try {
            yield BidService.completeBidAcceptance(bidId);
            console.log(`Bid ${bidId} acceptance completed after capture (amount_capturable_updated)`);
        }
        catch (error) {
            console.error('Failed to complete bid acceptance after capture:', error);
        }
    }
    catch (error) {
        console.error(`Error in handleAmountCapturableUpdated for payment ${paymentIntent.id}:`, error);
    }
});
// Get user payments (for user-specific routes)
const getUserPayments = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, page = 1, limit = 10) {
    try {
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        const payments = yield payment_model_1.Payment.getPaymentsByUser(userObjectId);
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to get user payments: ${errorMessage}`);
    }
});
exports.getUserPayments = getUserPayments;
// Get user payment statistics
const getUserPaymentStats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        const filters = {
            posterId: userObjectId,
            freelancerId: userObjectId,
        };
        return yield (0, exports.getPaymentStats)(filters);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to get user payment stats: ${errorMessage}`);
    }
});
exports.getUserPaymentStats = getUserPaymentStats;
const deleteStripeAccountService = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Delete account from Stripe
        const deleted = yield stripe_1.stripe.accounts.del(accountId);
        if (!deleted.deleted) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to delete account');
        }
        return deleted; // { id, object, deleted: true }
    }
    catch (error) {
        throw (0, stripe_1.handleStripeError)(error);
    }
});
// Get payment history for poster, tasker, super admin with QueryBuilder
const getPaymentHistory = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 🔹 Use string directly for Mongoose to cast automatically
        const objectId = userId;
        // Base query (poster or freelancer) + populate freelancer name
        const baseQuery = payment_model_1.Payment.find({
            $or: [{ posterId: objectId }, { freelancerId: objectId }],
        }).populate('freelancerId', 'name'); // populate only name field
        // Query builder with populate
        const queryBuilder = new QueryBuilder_1.default(baseQuery, query)
            .search(['status', 'currency'])
            .filter()
            .dateFilter()
            .sort()
            .paginate()
            .fields();
        // Execute query with pagination
        const { data: payments, pagination } = yield queryBuilder.getFilteredResults();
        // Format data
        const formattedPayments = payments.map((payment) => ({
            paymentId: payment.stripePaymentIntentId,
            taskerName: payment.freelancerId ? payment.freelancerId.name : 'N/A',
            amount: payment.amount,
            transactionDate: payment.createdAt,
            paymentStatus: payment.status,
        }));
        return {
            success: true,
            data: formattedPayments,
            pagination,
        };
    }
    catch (error) {
        console.error('Error fetching payment history:', error);
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to fetch payment history');
    }
});
// Retrieve current Stripe PaymentIntent for a bid and return client_secret when applicable
const getCurrentIntentByBid = (bidId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!mongoose_1.default.isValidObjectId(bidId)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid bidId');
    }
    const payments = yield payment_model_1.Payment.getPaymentsByBid(new mongoose_1.default.Types.ObjectId(bidId));
    if (!payments || payments.length === 0) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'No payment found for this bid');
    }
    // Prefer pending payment; otherwise take the most recent
    const payment = payments.find((p) => p.status === payment_interface_1.PAYMENT_STATUS.PENDING) || payments[0];
    if (!payment.stripePaymentIntentId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Payment does not have a Stripe PaymentIntent');
    }
    const intent = yield stripe_1.stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
    // Only return client_secret when the intent is awaiting confirmation or action
    const statusesWithSecret = new Set([
        'requires_payment_method',
        'requires_confirmation',
        'requires_action',
        'processing',
    ]);
    const response = {
        bidId,
        paymentId: (_a = payment._id) === null || _a === void 0 ? void 0 : _a.toString(),
        stripePaymentIntentId: intent.id,
        intent_status: intent.status,
    };
    if (statusesWithSecret.has(intent.status) && intent.client_secret) {
        response.client_secret = intent.client_secret;
    }
    return response;
});
exports.getCurrentIntentByBid = getCurrentIntentByBid;
const PaymentService = {
    createStripeAccount: exports.createStripeAccount,
    getPaymentHistory,
    createOnboardingLink: exports.createOnboardingLink,
    checkOnboardingStatus: exports.checkOnboardingStatus,
    createEscrowPayment: exports.createEscrowPayment,
    releaseEscrowPayment: exports.releaseEscrowPayment,
    refundEscrowPayment: exports.refundEscrowPayment,
    getPaymentById: exports.getPaymentById,
    getPayments: exports.getPayments,
    getPaymentStats: exports.getPaymentStats,
    getUserPayments: exports.getUserPayments,
    getUserPaymentStats: exports.getUserPaymentStats,
    handleWebhookEvent: exports.handleWebhookEvent,
    getCurrentIntentByBid: exports.getCurrentIntentByBid,
    deleteStripeAccountService,
};
exports.default = PaymentService;
