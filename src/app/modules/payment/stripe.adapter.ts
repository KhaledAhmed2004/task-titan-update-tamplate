import { stripe, dollarsToCents, handleStripeError, DEFAULT_CURRENCY } from '../../../config/stripe';
import Stripe from 'stripe';

// Centralized Stripe adapter to keep payment.service.ts clean and consistent
// Only wraps Stripe API calls; business logic stays in services.

export type CreateExpressAccountParams = {
  email: string;
  firstName: string;
  lastName?: string;
  dob?: { year: number; month: number; day: number };
  city?: string;
  metadata?: Record<string, any>;
};

export const createExpressAccount = async (
  params: CreateExpressAccountParams
): Promise<Stripe.Account> => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: params.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        first_name: params.firstName,
        last_name: params.lastName || '',
        email: params.email,
        dob: params.dob,
        address: {
          city: params.city,
          country: 'US',
        },
      },
      metadata: params.metadata,
    });
    return account;
  } catch (error) {
    throw new Error(`createExpressAccount failed: ${handleStripeError(error)}`);
  }
};

export const createOnboardingLink = async (
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<string> => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    return accountLink.url;
  } catch (error) {
    throw new Error(`createOnboardingLink failed: ${handleStripeError(error)}`);
  }
};

export const retrieveAccount = async (accountId: string): Promise<Stripe.Account> => {
  try {
    return await stripe.accounts.retrieve(accountId);
  } catch (error) {
    throw new Error(`retrieveAccount failed: ${handleStripeError(error)}`);
  }
};

export const deleteAccount = async (accountId: string): Promise<Stripe.DeletedAccount> => {
  try {
    return await stripe.accounts.del(accountId);
  } catch (error) {
    throw new Error(`deleteAccount failed: ${handleStripeError(error)}`);
  }
};

export type CreatePaymentIntentParams = {
  amountDollars: number;
  currency?: string;
  metadata?: Record<string, any>;
  captureMethod?: 'automatic' | 'manual';
};

export const createPaymentIntent = async (
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> => {
  try {
    const intent = await stripe.paymentIntents.create({
      amount: dollarsToCents(params.amountDollars),
      currency: params.currency || DEFAULT_CURRENCY,
      automatic_payment_methods: { enabled: true },
      capture_method: params.captureMethod || 'manual',
      metadata: params.metadata,
    });
    return intent;
  } catch (error) {
    throw new Error(`createPaymentIntent failed: ${handleStripeError(error)}`);
  }
};

export const retrievePaymentIntent = async (
  intentId: string
): Promise<Stripe.PaymentIntent> => {
  try {
    return await stripe.paymentIntents.retrieve(intentId);
  } catch (error) {
    throw new Error(`retrievePaymentIntent failed: ${handleStripeError(error)}`);
  }
};

export type CreateTransferParams = {
  amountDollars: number;
  currency?: string;
  destinationAccountId: string;
  sourceChargeId?: string;
  metadata?: Record<string, any>;
};

export const createTransfer = async (
  params: CreateTransferParams
): Promise<Stripe.Transfer> => {
  try {
    const transfer = await stripe.transfers.create({
      amount: dollarsToCents(params.amountDollars),
      currency: params.currency || DEFAULT_CURRENCY,
      destination: params.destinationAccountId,
      source_transaction: params.sourceChargeId,
      metadata: params.metadata,
    });
    return transfer;
  } catch (error) {
    throw new Error(`createTransfer failed: ${handleStripeError(error)}`);
  }
};

export const createRefundForIntent = async (
  intentId: string,
  reason?: string
): Promise<Stripe.Refund> => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: intentId,
      reason: reason as any,
    });
    return refund;
  } catch (error) {
    throw new Error(`createRefundForIntent failed: ${handleStripeError(error)}`);
  }
};