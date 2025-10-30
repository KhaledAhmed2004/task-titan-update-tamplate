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
exports.StripeConnectController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const payment_service_1 = require("./payment.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const stripeConnect_service_1 = __importDefault(require("./stripeConnect.service"));
const createStripeAccountController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user.id;
    const { accountType } = req.body;
    if (!userId || !accountType) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'User ID and account type are required');
    }
    const result = yield stripeConnect_service_1.default.createStripeAccount({ userId, accountType });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: 'Stripe account created successfully',
        data: result,
    });
}));
const getOnboardingLinkController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user.id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'User ID is required');
    }
    const onboardingUrl = yield stripeConnect_service_1.default.createOnboardingLink(userId);
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
const checkOnboardingStatusController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user.id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'User ID is required');
    }
    const status = yield stripeConnect_service_1.default.checkOnboardingStatus(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Onboarding status retrieved successfully',
        data: status,
    });
}));
// Handle Stripe webhook
const handleStripeWebhookController = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.StripeConnectController = {
    createStripeAccountController,
    getOnboardingLinkController,
    checkOnboardingStatusController,
    handleStripeWebhookController,
};
