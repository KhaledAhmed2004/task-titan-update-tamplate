"use strict";
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
exports.getCurrentIntentByBid = exports.getUserPaymentStats = exports.getUserPayments = exports.handleWebhookEvent = exports.getPaymentStatsOverview = exports.getPayments = exports.getPaymentById = exports.refundEscrowPayment = exports.releaseEscrowPayment = exports.createEscrowPayment = void 0;
const payment_interface_1 = require("./payment.interface");
const mongoose_1 = __importDefault(require("mongoose"));
const payment_model_1 = require("./payment.model");
const domain_adapter_1 = require("./domain.adapter");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const AggregationBuilder_1 = __importDefault(require("../../builder/AggregationBuilder"));
const stripe_1 = require("../../../config/stripe");
const stripe_adapter_1 = require("./stripe.adapter");
const stripeConnect_service_1 = __importDefault(require("./stripeConnect.service"));
// Helper to present sender/receiver aliases for readability
const mapPaymentToView = (payment) => {
    const base = typeof (payment === null || payment === void 0 ? void 0 : payment.toObject) === 'function' ? payment.toObject() : payment;
    return Object.assign(Object.assign({}, base), { senderId: base.posterId, receiverId: base.freelancerId });
};
// Moved to stripeConnected.service.ts
// Moved to stripeConnected.service.ts
// Moved to stripeConnected.service.ts
// Create escrow payment when bid is accepted
// Escrow helpers (internal)
const getBidAndTask = (bidId) => __awaiter(void 0, void 0, void 0, function* () {
    return domain_adapter_1.PaymentDomainAdapter.getBidAndTask(String(bidId));
});
// Moved to stripeConnected.service.ts
const ensureNoExistingPaymentForBid = (bidId) => __awaiter(void 0, void 0, void 0, function* () {
    const existingPayment = yield payment_model_1.Payment.getPaymentsByBid(bidId);
    if (existingPayment && existingPayment.length > 0) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Payment already exists for this bid');
    }
});
const buildIntentMetadata = (data, task) => ({
    bid_id: data.bidId.toString(),
    poster_id: data.posterId.toString(),
    freelancer_id: data.freelancerId.toString(),
    task_title: task === null || task === void 0 ? void 0 : task.title,
    type: 'escrow_payment',
});
const createEscrowIntent = (amount, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, stripe_adapter_1.createPaymentIntent)({
        amountDollars: amount,
        currency: stripe_1.DEFAULT_CURRENCY,
        captureMethod: 'manual',
        metadata,
    });
});
const createPaymentRecord = (data, platformFee, freelancerAmount, paymentIntentId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = new payment_model_1.Payment({
        taskId: data.taskId,
        bidId: data.bidId,
        posterId: data.posterId,
        freelancerId: data.freelancerId,
        amount: data.amount,
        platformFee,
        freelancerAmount,
        stripePaymentIntentId: paymentIntentId,
        status: payment_interface_1.PAYMENT_STATUS.PENDING,
        currency: stripe_1.DEFAULT_CURRENCY,
        metadata: data.metadata,
    });
    yield payment.save();
    return payment;
});
const createEscrowPayment = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate required fields early
        if (!data.bidId) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Bid ID is required for escrow payment');
        }
        if (!data.posterId) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Poster ID is required for escrow payment');
        }
        const { bid, task, freelancerId } = yield getBidAndTask(data.bidId);
        yield stripeConnect_service_1.default.ensureFreelancerOnboarded(freelancerId);
        yield ensureNoExistingPaymentForBid(data.bidId);
        const platformFee = (0, stripe_1.calculatePlatformFee)(data.amount);
        const freelancerAmount = (0, stripe_1.calculateFreelancerAmount)(data.amount);
        const metadata = buildIntentMetadata(data, task);
        const paymentIntent = yield createEscrowIntent(data.amount, metadata);
        const payment = yield createPaymentRecord(data, platformFee, freelancerAmount, paymentIntent.id);
        return {
            payment,
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
// Release helpers (internal)
const getPaymentOrThrow = (paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield payment_model_1.Payment.isExistPaymentById(paymentId.toString());
    if (!payment) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Payment not found');
    }
    return payment;
});
const ensureHeldStatus = (payment) => {
    if (payment.status !== payment_interface_1.PAYMENT_STATUS.HELD) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Payment is not in held status. Current status: ${payment.status}`);
    }
};
const ensureClientAuthorized = (taskId, clientId) => __awaiter(void 0, void 0, void 0, function* () {
    yield domain_adapter_1.PaymentDomainAdapter.ensureClientAuthorized(String(taskId), clientId ? String(clientId) : undefined);
});
const getChargeIdForIntent = (intentId) => __awaiter(void 0, void 0, void 0, function* () {
    const paymentIntent = yield stripe_1.stripe.paymentIntents.retrieve(intentId, {
        expand: ['latest_charge'],
    });
    let chargeId;
    const latestCharge = paymentIntent.latest_charge;
    if (typeof latestCharge === 'string') {
        chargeId = latestCharge;
    }
    else if (latestCharge && latestCharge.id) {
        chargeId = latestCharge.id;
    }
    if (!chargeId) {
        const chargeList = yield stripe_1.stripe.charges.list({
            payment_intent: intentId,
            limit: 1,
        });
        if (chargeList.data && chargeList.data.length > 0) {
            chargeId = chargeList.data[0].id;
        }
    }
    return { chargeId, canTransferWithoutSource: !chargeId };
});
// Moved to stripeConnected.service.ts
const createTransferToFreelancer = (amount, currency, destination, sourceChargeId, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, stripe_adapter_1.createTransfer)({
        amountDollars: amount,
        currency,
        destinationAccountId: destination,
        sourceChargeId,
        metadata,
    });
});
const markPaymentReleasedAndBidCompleted = (paymentId, bidId) => __awaiter(void 0, void 0, void 0, function* () {
    yield payment_model_1.Payment.updatePaymentStatus(paymentId, payment_interface_1.PAYMENT_STATUS.RELEASED);
    yield domain_adapter_1.PaymentDomainAdapter.markBidCompleted(String(bidId));
});
const releaseEscrowPayment = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const payment = yield getPaymentOrThrow(data.paymentId);
        ensureHeldStatus(payment);
        yield ensureClientAuthorized(payment.taskId, data.clientId);
        const { chargeId } = yield getChargeIdForIntent(payment.stripePaymentIntentId);
        const freelancerStripeAccount = yield stripeConnect_service_1.default.getFreelancerAccountOrThrow(payment.freelancerId);
        yield createTransferToFreelancer(payment.freelancerAmount, payment.currency || stripe_1.DEFAULT_CURRENCY, freelancerStripeAccount.stripeAccountId, chargeId, {
            bid_id: ((_b = (_a = payment.bidId) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) || String(payment.bidId),
            payment_id: ((_d = (_c = payment._id) === null || _c === void 0 ? void 0 : _c.toString) === null || _d === void 0 ? void 0 : _d.call(_c)) || String(payment._id),
            intent_id: payment.stripePaymentIntentId,
            type: 'escrow_release_transfer',
        });
        yield markPaymentReleasedAndBidCompleted(data.paymentId, payment.bidId);
        return {
            success: true,
            message: 'Payment released and transferred to freelancer successfully',
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
// Refund helpers (internal)
const ensureRefundable = (payment) => {
    if (payment.status === payment_interface_1.PAYMENT_STATUS.REFUNDED) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Payment has already been refunded');
    }
    if (payment.status === payment_interface_1.PAYMENT_STATUS.RELEASED) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Cannot refund a payment that has already been released');
    }
};
const createRefundForIntent = (intentId, reason) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, stripe_adapter_1.createRefundForIntent)(intentId, reason);
});
const markPaymentRefunded = (paymentId, reason) => __awaiter(void 0, void 0, void 0, function* () {
    yield payment_model_1.Payment.updatePaymentStatus(new mongoose_1.default.Types.ObjectId(paymentId), payment_interface_1.PAYMENT_STATUS.REFUNDED);
    if (reason) {
        yield payment_model_1.Payment.findByIdAndUpdate(paymentId, {
            refundReason: reason,
        });
    }
});
const refundEscrowPayment = (paymentId, reason) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payment = yield payment_model_1.Payment.isExistPaymentById(paymentId);
        if (!payment) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Payment not found');
        }
        ensureRefundable(payment);
        const refund = yield createRefundForIntent(payment.stripePaymentIntentId, reason);
        yield markPaymentRefunded(paymentId, reason);
        yield domain_adapter_1.PaymentDomainAdapter.markBidCancelled(String(payment.bidId));
        return {
            success: true,
            message: 'Payment refunded successfully',
            refund_id: refund.id,
            amount_refunded: refund.amount / 100,
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
        return payment ? mapPaymentToView(payment) : null;
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
        // Validate and normalize pagination
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        if (pageNum < 1) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Page must be greater than 0');
        }
        if (limitNum < 1 || limitNum > 100) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Limit must be between 1 and 100');
        }
        // Build query object compatible with PaymentModel fields
        const queryObj = {};
        if (filters.status)
            queryObj.status = filters.status;
        if (filters.clientId)
            queryObj.posterId = filters.clientId;
        if (filters.freelancerId)
            queryObj.freelancerId = filters.freelancerId;
        if (filters.bidId)
            queryObj.bidId = filters.bidId;
        if (filters.dateFrom || filters.dateTo) {
            const createdAt = {};
            if (filters.dateFrom)
                createdAt.$gte = filters.dateFrom;
            if (filters.dateTo)
                createdAt.$lte = filters.dateTo;
            queryObj.createdAt = createdAt;
        }
        // Use QueryBuilder for filter/sort/pagination
        const qb = new QueryBuilder_1.default(payment_model_1.Payment.find(), Object.assign(Object.assign({}, queryObj), { page: pageNum, limit: limitNum }))
            .filter()
            .sort() // default '-createdAt'
            .paginate();
        // Deep populate bid -> task and tasker
        const populateOptions = domain_adapter_1.PaymentDomainAdapter.getPaymentsPopulateOptions();
        if (populateOptions) {
            qb.modelQuery = qb.modelQuery.populate(populateOptions);
        }
        const payments = yield qb.modelQuery;
        const pageInfo = yield qb.getPaginationInfo();
        return {
            payments: payments.map(mapPaymentToView),
            total: pageInfo.total,
            totalPages: pageInfo.totalPage,
            currentPage: pageInfo.page,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to get payments: ${errorMessage}`);
    }
});
exports.getPayments = getPayments;
// Payment stats overview (growth metrics similar to Task stats)
const getPaymentStatsOverview = () => __awaiter(void 0, void 0, void 0, function* () {
    const builder = new AggregationBuilder_1.default(payment_model_1.Payment);
    const allPayments = yield builder.calculateGrowth({ period: 'month' });
    const released = yield builder.calculateGrowth({
        filter: { status: payment_interface_1.PAYMENT_STATUS.RELEASED },
        period: 'month',
    });
    const pending = yield builder.calculateGrowth({
        filter: { status: payment_interface_1.PAYMENT_STATUS.PENDING },
        period: 'month',
    });
    const refunded = yield builder.calculateGrowth({
        filter: { status: payment_interface_1.PAYMENT_STATUS.REFUNDED },
        period: 'month',
    });
    return {
        allPayments,
        released,
        pending,
        refunded,
    };
});
exports.getPaymentStatsOverview = getPaymentStatsOverview;
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
            yield stripeConnect_service_1.default.handleAccountUpdated(event.data.object);
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
    var _a;
    const bidId = (_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.bid_id;
    try {
        // After capture, confirm local status HELD (funds on platform balance)
        yield payment_model_1.Payment.updateMany({
            bidId: bidId,
            stripePaymentIntentId: paymentIntent.id,
        }, {
            status: payment_interface_1.PAYMENT_STATUS.HELD,
        });
        // Do not re-trigger bid acceptance here; amount_capturable_updated handles capture + acceptance
        console.log(`Payment ${paymentIntent.id} succeeded; status set to HELD. No duplicate acceptance triggered.`);
    }
    catch (error) {
        console.error(`Error in handlePaymentSucceeded for payment ${paymentIntent.id}:`, error);
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
    yield domain_adapter_1.PaymentDomainAdapter.resetBidToPending(String(bidId), paymentIntent.id);
    // Revert task assignment and status if this bid was already accepted
    try {
        yield domain_adapter_1.PaymentDomainAdapter.revertTaskAssignmentIfMatches(String(bidId));
    }
    catch (revertErr) {
        console.error('Failed to revert task state after payment failure:', revertErr);
    }
});
// Moved to stripeConnected.service.ts
// Handle amount capturable updated webhook (manual capture flow)
const handleAmountCapturableUpdated = (paymentIntent) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const bidId = (_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.bid_id;
    try {
        if (!bidId) {
            console.error('❌ No bid_id in payment intent metadata for amount_capturable_updated:', paymentIntent.metadata);
            return;
        }
        // console.log(`Payment ${paymentIntent.id} is now capturable, capturing to hold funds on platform...`);
        try {
            // Capture the payment on the platform account (no transfer_data configured)
            const capturedPayment = yield stripe_1.stripe.paymentIntents.capture(paymentIntent.id);
            // console.log(`Payment ${paymentIntent.id} captured successfully (amount_capturable_updated handler)`);
            // Mark local payment as HELD (captured and held in platform balance)
            yield payment_model_1.Payment.updateMany({
                bidId: bidId,
                stripePaymentIntentId: paymentIntent.id,
            }, {
                status: payment_interface_1.PAYMENT_STATUS.HELD,
            });
        }
        catch (captureError) {
            console.error(`Failed to capture payment ${paymentIntent.id} in amount_capturable_updated handler:`, captureError);
            if (captureError.message &&
                captureError.message.includes('already been captured')) {
                console.log(`Payment ${paymentIntent.id} was already captured`);
                yield payment_model_1.Payment.updateMany({
                    bidId: bidId,
                    stripePaymentIntentId: paymentIntent.id,
                }, {
                    status: payment_interface_1.PAYMENT_STATUS.HELD,
                });
            }
            else {
                return;
            }
        }
        // Complete bid acceptance process after successful capture
        try {
            yield domain_adapter_1.PaymentDomainAdapter.completeBidAcceptanceAfterCapture(String(bidId));
            // console.log(`Bid ${bidId} acceptance completed after capture (amount_capturable_updated).`);
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
            payments: paginatedPayments.map(mapPaymentToView),
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
// Get user payment statistics (direct aggregation)
const getUserPaymentStats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        const matchStage = {
            $or: [{ posterId: userObjectId }, { freelancerId: userObjectId }],
        };
        const [totalStats, statusBreakdown, monthlyTrend] = yield Promise.all([
            payment_model_1.Payment.aggregate([
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
            payment_model_1.Payment.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),
            payment_model_1.Payment.aggregate([
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
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Failed to get user payment stats: ${errorMessage}`);
    }
});
exports.getUserPaymentStats = getUserPaymentStats;
// Moved to stripeConnected.service.ts
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
        const formattedPayments = payments.map(payment => ({
            paymentId: payment.stripePaymentIntentId,
            taskerName: payment.freelancerId
                ? payment.freelancerId.name
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
    const payment = payments.find((p) => p.status === payment_interface_1.PAYMENT_STATUS.PENDING) ||
        payments[0];
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
    getPaymentHistory,
    createEscrowPayment: exports.createEscrowPayment,
    releaseEscrowPayment: exports.releaseEscrowPayment,
    refundEscrowPayment: exports.refundEscrowPayment,
    getPaymentById: exports.getPaymentById,
    getPayments: exports.getPayments,
    getPaymentStatsOverview: exports.getPaymentStatsOverview,
    getUserPayments: exports.getUserPayments,
    getUserPaymentStats: exports.getUserPaymentStats,
    handleWebhookEvent: exports.handleWebhookEvent,
    getCurrentIntentByBid: exports.getCurrentIntentByBid,
};
exports.default = PaymentService;
