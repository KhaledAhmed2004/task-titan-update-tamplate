"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const payment_controller_1 = __importDefault(require("./payment.controller"));
const webhook_controller_1 = __importDefault(require("./webhook.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const router = express_1.default.Router();
// Webhook routes (no authentication required)
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), webhook_controller_1.default.handleStripeWebhook);
router.get('/webhook/health', webhook_controller_1.default.webhookHealthCheck);
// Stripe Connect account management
router.post('/stripe/account', (0, auth_1.default)(user_1.USER_ROLES.TASKER), payment_controller_1.default.createStripeAccountController);
router.get('/stripe/onboarding', (0, auth_1.default)(user_1.USER_ROLES.TASKER, user_1.USER_ROLES.SUPER_ADMIN), payment_controller_1.default.getOnboardingLinkController);
router.get('/stripe/onboarding-status', (0, auth_1.default)(user_1.USER_ROLES.TASKER, user_1.USER_ROLES.POSTER, user_1.USER_ROLES.SUPER_ADMIN), payment_controller_1.default.checkOnboardingStatusController);
// Payment history route for poster, tasker, super admin
router.get('/history', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER, user_1.USER_ROLES.SUPER_ADMIN), payment_controller_1.default.getPaymentHistoryController);
router.post('/refund/:paymentId', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.SUPER_ADMIN), payment_controller_1.default.refundPaymentController);
// Payment information retrieval
router.get('/:paymentId', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER, user_1.USER_ROLES.SUPER_ADMIN), payment_controller_1.default.getPaymentByIdController);
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), payment_controller_1.default.getPaymentsController);
router.get('/stats/overview', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), payment_controller_1.default.getPaymentStatsController);
router.delete('/account/:accountId', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), payment_controller_1.default.deleteStripeAccountController);
exports.PaymentRoutes = router;
