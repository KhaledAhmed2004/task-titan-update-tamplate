import express from 'express';
import PaymentController from './payment.controller';
import WebhookController from './webhook.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

// Webhook routes (no authentication required)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  WebhookController.handleStripeWebhook
);
router.get('/webhook/health', WebhookController.webhookHealthCheck);

// Stripe Connect account management
router.post(
  '/stripe/account',
  auth(USER_ROLES.TASKER),
  PaymentController.createStripeAccountController
);

router.get(
  '/stripe/onboarding',
  auth(USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
  PaymentController.getOnboardingLinkController
);

router.get(
  '/stripe/onboarding-status',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER, USER_ROLES.SUPER_ADMIN),
  PaymentController.checkOnboardingStatusController
);

// Payment history route for poster, tasker, super admin
router.get(
  '/history',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
  PaymentController.getPaymentHistoryController
);

router.post(
  '/refund/:paymentId',
  auth(USER_ROLES.POSTER, USER_ROLES.SUPER_ADMIN),
  PaymentController.refundPaymentController
);

// Payment information retrieval
router.get(
  '/:paymentId',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
  PaymentController.getPaymentByIdController
);

router.get(
  '/',
  auth(USER_ROLES.SUPER_ADMIN),
  PaymentController.getPaymentsController
);

router.get(
  '/stats/overview',
  auth(USER_ROLES.SUPER_ADMIN),
  PaymentController.getPaymentStatsController
);

router.delete(
  '/account/:accountId',
  auth(USER_ROLES.SUPER_ADMIN),
  PaymentController.deleteStripeAccountController
);



export const PaymentRoutes = router;
