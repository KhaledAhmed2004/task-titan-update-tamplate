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
const payment_service_1 = __importDefault(require("./payment.service"));
const http_status_1 = __importDefault(require("http-status"));
const stripe_1 = require("../../../config/stripe");
class WebhookController {
    constructor() {
        // Handle Stripe webhook events
        this.handleStripeWebhook = (req, res) => __awaiter(this, void 0, void 0, function* () {
            // // Enhanced logging for debugging
            // console.log('🔔 WEBHOOK RECEIVED:', {
            //   timestamp: new Date().toISOString(),
            //   headers: {
            //     'stripe-signature': req.headers['stripe-signature'] ? 'Present' : 'Missing',
            //     'content-type': req.headers['content-type'],
            //     'user-agent': req.headers['user-agent'],
            //   },
            //   bodySize: req.body ? req.body.length : 0,
            //   rawBody: req.body ? req.body.toString().substring(0, 200) + '...' : 'No body'
            // });
            const sig = req.headers['stripe-signature'];
            const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
            if (!endpointSecret) {
                console.error('❌ Stripe webhook secret not configured');
                return res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                    error: 'Webhook secret not configured',
                });
            }
            res.locals.webhookSecretPreview =
                endpointSecret.substring(0, 10) + '...';
            let event;
            try {
                // Verify webhook signature
                event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
                // console.log('✅ Webhook signature verified successfully');
                // Expose to global logger
                res.locals.webhookSignatureVerified = true;
            }
            catch (err) {
                console.error('❌ Webhook signature verification failed:', {
                    error: err.message,
                    signature: sig ? sig.substring(0, 20) + '...' : 'No signature',
                    bodyLength: req.body ? req.body.length : 0,
                });
                // Expose failure reason to global logger
                res.locals.webhookSignatureVerified = false;
                res.locals.webhookSignatureError =
                    (err === null || err === void 0 ? void 0 : err.message) || 'unknown error';
                return res.status(http_status_1.default.BAD_REQUEST).json({
                    error: `Webhook Error: ${err.message}`,
                });
            }
            // console.log('📨 Received webhook event:', {
            //   type: event.type,
            //   id: event.id,
            //   created: new Date(event.created * 1000).toISOString(),
            //   livemode: event.livemode,
            // });
            try {
                // Handle the event
                switch (event.type) {
                    case 'payment_intent.succeeded':
                        yield this.handlePaymentSucceeded(event.data.object);
                        break;
                    case 'payment_intent.payment_failed':
                        yield this.handlePaymentFailed(event.data.object);
                        break;
                    case 'payment_intent.canceled':
                        yield this.handlePaymentCanceled(event.data.object);
                        break;
                    case 'payment_intent.amount_capturable_updated':
                        yield this.handleAmountCapturableUpdated(event.data.object);
                        break;
                    case 'account.updated':
                        yield this.handleAccountUpdated(event.data.object);
                        break;
                    case 'transfer.created':
                        yield this.handleTransferCreated(event.data.object);
                        break;
                    case 'transfer.updated':
                        yield this.handleTransferUpdated(event.data.object);
                        break;
                    case 'payout.created':
                        yield this.handlePayoutCreated(event.data.object);
                        break;
                    case 'payout.updated':
                        yield this.handlePayoutUpdated(event.data.object);
                        break;
                    case 'charge.dispute.created':
                        yield this.handleDisputeCreated(event.data.object);
                        break;
                    default:
                        console.log(`Unhandled event type: ${event.type}`);
                }
                // Acknowledge receipt of the event
                res.json({ received: true });
            }
            catch (error) {
                console.error(`Error processing webhook event ${event.type}:`, error);
                res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                    error: 'Failed to process webhook event',
                });
            }
        });
        // Health check endpoint for webhook
        this.webhookHealthCheck = (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                webhook_endpoint: '/api/payment/webhook',
            });
        };
    }
    // Handle successful payment
    handlePaymentSucceeded(paymentIntent) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // console.log('💰 Processing payment succeeded:', {
                //   paymentIntentId: paymentIntent.id,
                //   amount: paymentIntent.amount,
                //   currency: paymentIntent.currency,
                //   status: paymentIntent.status,
                //   metadata: paymentIntent.metadata,
                // });
                const bidId = (_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.bid_id;
                if (!bidId) {
                    console.error('❌ No bid_id found in payment intent metadata:', paymentIntent.metadata);
                    return;
                }
                console.log('🎯 Processing payment for bid:', bidId);
                // Use the service method to handle the event
                yield payment_service_1.default.handleWebhookEvent({
                    type: 'payment_intent.succeeded',
                    data: { object: paymentIntent },
                });
                console.log('✅ Successfully processed payment_intent.succeeded for bid:', bidId);
            }
            catch (error) {
                console.error('❌ Error handling payment succeeded:', error);
                throw error;
            }
        });
    }
    // Handle failed payment
    handlePaymentFailed(paymentIntent) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                console.log(`Payment failed: ${paymentIntent.id}`);
                const bidId = (_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.bid_id;
                if (!bidId) {
                    console.error('No bid_id found in payment intent metadata');
                    return;
                }
                // Use the service method to handle the event
                yield payment_service_1.default.handleWebhookEvent({
                    type: 'payment_intent.payment_failed',
                    data: { object: paymentIntent },
                });
                console.log(`Successfully processed payment_intent.payment_failed for bid ${bidId}`);
            }
            catch (error) {
                console.error('Error handling payment failed:', error);
                throw error;
            }
        });
    }
    // Handle canceled payment
    handlePaymentCanceled(paymentIntent) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                console.log(`Payment canceled: ${paymentIntent.id}`);
                const bidId = (_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.bid_id;
                if (!bidId) {
                    console.error('No bid_id found in payment intent metadata');
                    return;
                }
                // Treat canceled payments similar to failed payments
                yield payment_service_1.default.handleWebhookEvent({
                    type: 'payment_intent.payment_failed',
                    data: { object: paymentIntent },
                });
                console.log(`Successfully processed payment_intent.canceled for bid ${bidId}`);
            }
            catch (error) {
                console.error('Error handling payment canceled:', error);
                throw error;
            }
        });
    }
    // Handle amount capturable updated (manual capture flow)
    handleAmountCapturableUpdated(paymentIntent) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // console.log('💳 Amount capturable updated:', {
                //   paymentIntentId: paymentIntent.id,
                //   amount_capturable: paymentIntent.amount_capturable,
                //   currency: paymentIntent.currency,
                //   status: paymentIntent.status,
                //   metadata: paymentIntent.metadata,
                // });
                const bidId = (_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.bid_id;
                if (!bidId) {
                    console.error('❌ No bid_id found in payment intent metadata:', paymentIntent.metadata);
                    return;
                }
                // console.log('🎯 Triggering capture for bid:', bidId);
                // Delegate to service to perform capture + updates
                yield payment_service_1.default.handleWebhookEvent({
                    type: 'payment_intent.amount_capturable_updated',
                    data: { object: paymentIntent },
                });
                // console.log(
                //   '✅ Successfully processed amount_capturable_updated for bid:',
                //   bidId
                // );
            }
            catch (error) {
                console.error('❌ Error handling amount capturable updated:', error);
                throw error;
            }
        });
    }
    // Handle Stripe Connect account updates
    handleAccountUpdated(account) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Account updated: ${account.id}`);
                // Use the service method to handle the event
                yield payment_service_1.default.handleWebhookEvent({
                    type: 'account.updated',
                    data: { object: account },
                });
                console.log(`Successfully processed account.updated for account ${account.id}`);
            }
            catch (error) {
                console.error('Error handling account updated:', error);
                throw error;
            }
        });
    }
    // Handle transfer creation (money moved to freelancer)
    handleTransferCreated(transfer) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Transfer created: ${transfer.id} to ${transfer.destination}`);
                // Log transfer details for monitoring
                console.log({
                    transfer_id: transfer.id,
                    amount: transfer.amount,
                    currency: transfer.currency,
                    destination: transfer.destination,
                    created: transfer.created,
                });
            }
            catch (error) {
                console.error('Error handling transfer created:', error);
                throw error;
            }
        });
    }
    // Handle transfer updates
    handleTransferUpdated(transfer) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Transfer updated: ${transfer.id} - Status: ${transfer.status}`);
                // Log transfer status changes
                if (transfer.status === 'failed') {
                    console.error(`Transfer failed: ${transfer.id}`, transfer.failure_message);
                    // TODO: Implement failure handling - notify users, update payment status
                }
            }
            catch (error) {
                console.error('Error handling transfer updated:', error);
                throw error;
            }
        });
    }
    // Handle payout creation (money moved from Stripe to bank account)
    handlePayoutCreated(payout) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Payout created: ${payout.id}`);
                // Log payout details for monitoring
                console.log({
                    payout_id: payout.id,
                    amount: payout.amount,
                    currency: payout.currency,
                    status: payout.status,
                    arrival_date: payout.arrival_date,
                });
            }
            catch (error) {
                console.error('Error handling payout created:', error);
                throw error;
            }
        });
    }
    // Handle payout updates
    handlePayoutUpdated(payout) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Payout updated: ${payout.id} - Status: ${payout.status}`);
                // Log payout status changes
                if (payout.status === 'failed') {
                    console.error(`Payout failed: ${payout.id}`, payout.failure_message);
                    // TODO: Implement failure handling - notify freelancer
                }
                else if (payout.status === 'paid') {
                    console.log(`Payout completed: ${payout.id}`);
                    // TODO: Implement success handling - notify freelancer
                }
            }
            catch (error) {
                console.error('Error handling payout updated:', error);
                throw error;
            }
        });
    }
    // Handle dispute creation (chargeback)
    handleDisputeCreated(dispute) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Dispute created: ${dispute.id} for charge: ${dispute.charge}`);
                // Log dispute details
                console.log({
                    dispute_id: dispute.id,
                    charge_id: dispute.charge,
                    amount: dispute.amount,
                    currency: dispute.currency,
                    reason: dispute.reason,
                    status: dispute.status,
                });
                // TODO: Implement dispute handling
                // - Notify admin/support team
                // - Update payment status
                // - Freeze related funds if necessary
                // - Send notification to affected users
                console.warn('DISPUTE ALERT: Manual review required for dispute', dispute.id);
            }
            catch (error) {
                console.error('Error handling dispute created:', error);
                throw error;
            }
        });
    }
}
exports.default = new WebhookController();
