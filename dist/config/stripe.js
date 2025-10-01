"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeConfig = exports.handleStripeError = exports.calculateFreelancerAmount = exports.calculatePlatformFee = exports.centsToDollars = exports.dollarsToCents = exports.PLATFORM_FEE_PERCENTAGE = exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
// Initialize Stripe with secret key
exports.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
    typescript: true,
});
// Platform configuration constants
exports.PLATFORM_FEE_PERCENTAGE = Number(process.env.PLATFORM_FEE_PERCENTAGE) || 20;
// Utility functions for payment calculations
const dollarsToCents = (dollars) => {
    return Math.round(dollars * 100);
};
exports.dollarsToCents = dollarsToCents;
const centsToDollars = (cents) => {
    return cents / 100;
};
exports.centsToDollars = centsToDollars;
const calculatePlatformFee = (amount) => {
    return Math.round((amount * exports.PLATFORM_FEE_PERCENTAGE) / 100);
};
exports.calculatePlatformFee = calculatePlatformFee;
const calculateFreelancerAmount = (totalAmount) => {
    const platformFee = (0, exports.calculatePlatformFee)(totalAmount);
    return totalAmount - platformFee;
};
exports.calculateFreelancerAmount = calculateFreelancerAmount;
// Error handling utility
const handleStripeError = (error) => {
    if (error.type === 'StripeCardError') {
        return `Card error: ${error.message}`;
    }
    else if (error.type === 'StripeRateLimitError') {
        return 'Rate limit error: Too many requests made to the API too quickly';
    }
    else if (error.type === 'StripeInvalidRequestError') {
        return `Invalid request: ${error.message}`;
    }
    else if (error.type === 'StripeAPIError') {
        return "API error: An error occurred internally with Stripe's API";
    }
    else if (error.type === 'StripeConnectionError') {
        return 'Connection error: A network error occurred';
    }
    else if (error.type === 'StripeAuthenticationError') {
        return "Authentication error: Authentication with Stripe's API failed";
    }
    else {
        return `Unknown error: ${error.message || 'Something went wrong'}`;
    }
};
exports.handleStripeError = handleStripeError;
// Stripe configuration object
exports.stripeConfig = {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    platformFeePercentage: exports.PLATFORM_FEE_PERCENTAGE,
    minimumAmount: Number(process.env.MINIMUM_PAYMENT_AMOUNT) || 5.0,
    maximumAmount: Number(process.env.MAXIMUM_PAYMENT_AMOUNT) || 10000.0,
};
