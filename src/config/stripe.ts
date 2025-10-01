import Stripe from 'stripe';

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil' as Stripe.LatestApiVersion,
  typescript: true,
});

// Platform configuration constants
export const PLATFORM_FEE_PERCENTAGE =
  Number(process.env.PLATFORM_FEE_PERCENTAGE) || 20;

// Utility functions for payment calculations
export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

export const centsToDollars = (cents: number): number => {
  return cents / 100;
};

export const calculatePlatformFee = (amount: number): number => {
  return Math.round((amount * PLATFORM_FEE_PERCENTAGE) / 100);
};

export const calculateFreelancerAmount = (totalAmount: number): number => {
  const platformFee = calculatePlatformFee(totalAmount);
  return totalAmount - platformFee;
};

// Error handling utility
export const handleStripeError = (error: any): string => {
  if (error.type === 'StripeCardError') {
    return `Card error: ${error.message}`;
  } else if (error.type === 'StripeRateLimitError') {
    return 'Rate limit error: Too many requests made to the API too quickly';
  } else if (error.type === 'StripeInvalidRequestError') {
    return `Invalid request: ${error.message}`;
  } else if (error.type === 'StripeAPIError') {
    return "API error: An error occurred internally with Stripe's API";
  } else if (error.type === 'StripeConnectionError') {
    return 'Connection error: A network error occurred';
  } else if (error.type === 'StripeAuthenticationError') {
    return "Authentication error: Authentication with Stripe's API failed";
  } else {
    return `Unknown error: ${error.message || 'Something went wrong'}`;
  }
};

// Stripe configuration object
export const stripeConfig = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
  minimumAmount: Number(process.env.MINIMUM_PAYMENT_AMOUNT) || 5.0,
  maximumAmount: Number(process.env.MAXIMUM_PAYMENT_AMOUNT) || 10000.0,
};
