import { Request, Response } from 'express';
import PaymentService from './payment.service';
import httpStatus from 'http-status';
import { stripe } from '../../../config/stripe';

class WebhookController {
  // Handle Stripe webhook events
  handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Webhook secret not configured',
      });
    }

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.log(`Webhook signature verification failed: ${err.message}`);
      return res.status(httpStatus.BAD_REQUEST).json({
        error: `Webhook Error: ${err.message}`,
      });
    }

    console.log(`Received webhook event: ${event.type}`);

    try {
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object);
          break;

        case 'account.updated':
          await this.handleAccountUpdated(event.data.object);
          break;

        case 'transfer.created':
          await this.handleTransferCreated(event.data.object);
          break;

        case 'transfer.updated':
          await this.handleTransferUpdated(event.data.object);
          break;

        case 'payout.created':
          await this.handlePayoutCreated(event.data.object);
          break;

        case 'payout.updated':
          await this.handlePayoutUpdated(event.data.object);
          break;

        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Acknowledge receipt of the event
      res.json({ received: true });
    } catch (error: any) {
      console.error(`Error processing webhook event ${event.type}:`, error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to process webhook event',
      });
    }
  };

  // Handle successful payment
  private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    try {
      console.log(`Payment succeeded: ${paymentIntent.id}`);

      const bidId = paymentIntent.metadata?.bid_id;
      if (!bidId) {
        console.error('No bid_id found in payment intent metadata');
        return;
      }

      // Use the service method to handle the event
      await PaymentService.handleWebhookEvent({
        type: 'payment_intent.succeeded',
        data: { object: paymentIntent },
      });

      console.log(
        `Successfully processed payment_intent.succeeded for bid ${bidId}`
      );
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
      throw error;
    }
  }

  // Handle failed payment
  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    try {
      console.log(`Payment failed: ${paymentIntent.id}`);

      const bidId = paymentIntent.metadata?.bid_id;
      if (!bidId) {
        console.error('No bid_id found in payment intent metadata');
        return;
      }

      // Use the service method to handle the event
      await PaymentService.handleWebhookEvent({
        type: 'payment_intent.payment_failed',
        data: { object: paymentIntent },
      });

      console.log(
        `Successfully processed payment_intent.payment_failed for bid ${bidId}`
      );
    } catch (error) {
      console.error('Error handling payment failed:', error);
      throw error;
    }
  }

  // Handle canceled payment
  private async handlePaymentCanceled(paymentIntent: any): Promise<void> {
    try {
      console.log(`Payment canceled: ${paymentIntent.id}`);

      const bidId = paymentIntent.metadata?.bid_id;
      if (!bidId) {
        console.error('No bid_id found in payment intent metadata');
        return;
      }

      // Treat canceled payments similar to failed payments
      await PaymentService.handleWebhookEvent({
        type: 'payment_intent.payment_failed',
        data: { object: paymentIntent },
      });

      console.log(
        `Successfully processed payment_intent.canceled for bid ${bidId}`
      );
    } catch (error) {
      console.error('Error handling payment canceled:', error);
      throw error;
    }
  }

  // Handle Stripe Connect account updates
  private async handleAccountUpdated(account: any): Promise<void> {
    try {
      console.log(`Account updated: ${account.id}`);

      // Use the service method to handle the event
      await PaymentService.handleWebhookEvent({
        type: 'account.updated',
        data: { object: account },
      });

      console.log(
        `Successfully processed account.updated for account ${account.id}`
      );
    } catch (error) {
      console.error('Error handling account updated:', error);
      throw error;
    }
  }

  // Handle transfer creation (money moved to freelancer)
  private async handleTransferCreated(transfer: any): Promise<void> {
    try {
      console.log(
        `Transfer created: ${transfer.id} to ${transfer.destination}`
      );

      // Log transfer details for monitoring
      console.log({
        transfer_id: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency,
        destination: transfer.destination,
        created: transfer.created,
      });
    } catch (error) {
      console.error('Error handling transfer created:', error);
      throw error;
    }
  }

  // Handle transfer updates
  private async handleTransferUpdated(transfer: any): Promise<void> {
    try {
      console.log(
        `Transfer updated: ${transfer.id} - Status: ${transfer.status}`
      );

      // Log transfer status changes
      if (transfer.status === 'failed') {
        console.error(
          `Transfer failed: ${transfer.id}`,
          transfer.failure_message
        );
        // TODO: Implement failure handling - notify users, update payment status
      }
    } catch (error) {
      console.error('Error handling transfer updated:', error);
      throw error;
    }
  }

  // Handle payout creation (money moved from Stripe to bank account)
  private async handlePayoutCreated(payout: any): Promise<void> {
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
    } catch (error) {
      console.error('Error handling payout created:', error);
      throw error;
    }
  }

  // Handle payout updates
  private async handlePayoutUpdated(payout: any): Promise<void> {
    try {
      console.log(`Payout updated: ${payout.id} - Status: ${payout.status}`);

      // Log payout status changes
      if (payout.status === 'failed') {
        console.error(`Payout failed: ${payout.id}`, payout.failure_message);
        // TODO: Implement failure handling - notify freelancer
      } else if (payout.status === 'paid') {
        console.log(`Payout completed: ${payout.id}`);
        // TODO: Implement success handling - notify freelancer
      }
    } catch (error) {
      console.error('Error handling payout updated:', error);
      throw error;
    }
  }

  // Handle dispute creation (chargeback)
  private async handleDisputeCreated(dispute: any): Promise<void> {
    try {
      console.log(
        `Dispute created: ${dispute.id} for charge: ${dispute.charge}`
      );

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

      console.warn(
        'DISPUTE ALERT: Manual review required for dispute',
        dispute.id
      );
    } catch (error) {
      console.error('Error handling dispute created:', error);
      throw error;
    }
  }

  // Health check endpoint for webhook
  webhookHealthCheck = (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      webhook_endpoint: '/api/payment/webhook',
    });
  };
}

export default new WebhookController();
