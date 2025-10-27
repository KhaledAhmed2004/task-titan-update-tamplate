import express from 'express';
import PaymentController from './payment.controller';
import WebhookController from './webhook.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { StripeConnectController } from './stripeConnect.controller';

const router = express.Router();

// Webhook routes (no authentication required)
// Note: Raw body parsing is handled at app level for webhook routes
router.post(
  '/webhook',
  WebhookController.handleStripeWebhook
);

// Stripe Connect account management
router.post(
  '/stripe/account',
  auth(USER_ROLES.TASKER),
  StripeConnectController.createStripeAccountController
);

router.get(
  '/stripe/onboarding',
  auth(USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
  StripeConnectController.getOnboardingLinkController
);

router.get(
  '/stripe/onboarding-status',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER, USER_ROLES.SUPER_ADMIN),
  StripeConnectController.checkOnboardingStatusController
);

// Payment history route for poster, tasker, super admin
router.get(
  '/history',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
  PaymentController.getPaymentHistoryController
);

// Retrieve current intent and client_secret by bidId
router.get(
  '/by-bid/:bidId/current-intent',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
  PaymentController.getCurrentIntentByBidController
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
  '/stats',
  auth(USER_ROLES.SUPER_ADMIN),
  PaymentController.getPaymentStatsController
);

router.delete(
  '/account/:accountId',
  auth(USER_ROLES.SUPER_ADMIN),
  PaymentController.deleteStripeAccountController
);



export const PaymentRoutes = router;
