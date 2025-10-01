import { z } from 'zod';

// Create Stripe account validation
export const createStripeAccountZodSchema = z.object({
  body: z.object({
    userId: z.number({
      required_error: 'User ID is required',
    }).positive('User ID must be positive'),
    accountType: z.enum(['client', 'freelancer'], {
      required_error: 'Account type is required',
      invalid_type_error: 'Account type must be either client or freelancer',
    }),
  }),
});

// Create escrow payment validation
export const createEscrowPaymentZodSchema = z.object({
  body: z.object({
    bidId: z.number({
      required_error: 'Bid ID is required',
    }).positive('Bid ID must be positive'),
    amount: z.number({
      required_error: 'Amount is required',
    }).positive('Amount must be greater than 0').max(100000, 'Amount cannot exceed $100,000'),
    clientId: z.number({
      required_error: 'Client ID is required',
    }).positive('Client ID must be positive'),
    freelancerId: z.number({
      required_error: 'Freelancer ID is required',
    }).positive('Freelancer ID must be positive'),
  }),
});

// Release payment validation
export const releasePaymentZodSchema = z.object({
  params: z.object({
    paymentId: z.string({
      required_error: 'Payment ID is required',
    }).regex(/^\d+$/, 'Payment ID must be a valid number'),
  }),
  body: z.object({
    releaseType: z.enum(['complete', 'partial', 'refund']).optional().default('complete'),
    amount: z.number().positive('Amount must be greater than 0').optional(),
  }),
});

// Refund payment validation
export const refundPaymentZodSchema = z.object({
  params: z.object({
    paymentId: z.string({
      required_error: 'Payment ID is required',
    }).regex(/^\d+$/, 'Payment ID must be a valid number'),
  }),
  body: z.object({
    reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
  }),
});

// Get payment by ID validation
export const getPaymentByIdZodSchema = z.object({
  params: z.object({
    paymentId: z.string({
      required_error: 'Payment ID is required',
    }).regex(/^\d+$/, 'Payment ID must be a valid number'),
  }),
});

// Get user payments validation
export const getUserPaymentsZodSchema = z.object({
  params: z.object({
    userId: z.string({
      required_error: 'User ID is required',
    }).regex(/^\d+$/, 'User ID must be a valid number'),
  }),
  query: z.object({
    userType: z.enum(['client', 'freelancer'], {
      required_error: 'User type is required',
      invalid_type_error: 'User type must be either client or freelancer',
    }),
    page: z.string().regex(/^\d+$/, 'Page must be a valid number').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a valid number').optional(),
    status: z.enum(['pending', 'held', 'released', 'refunded']).optional(),
  }),
});

// Get payments with filters validation
export const getPaymentsZodSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a valid number').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a valid number').optional(),
    status: z.enum(['pending', 'held', 'released', 'refunded']).optional(),
    clientId: z.string().regex(/^\d+$/, 'Client ID must be a valid number').optional(),
    freelancerId: z.string().regex(/^\d+$/, 'Freelancer ID must be a valid number').optional(),
    bidId: z.string().regex(/^\d+$/, 'Bid ID must be a valid number').optional(),
    dateFrom: z.string().datetime('Invalid date format for dateFrom').optional(),
    dateTo: z.string().datetime('Invalid date format for dateTo').optional(),
  }),
});

// Get payment stats validation
export const getPaymentStatsZodSchema = z.object({
  query: z.object({
    clientId: z.string().regex(/^\d+$/, 'Client ID must be a valid number').optional(),
    freelancerId: z.string().regex(/^\d+$/, 'Freelancer ID must be a valid number').optional(),
    dateFrom: z.string().datetime('Invalid date format for dateFrom').optional(),
    dateTo: z.string().datetime('Invalid date format for dateTo').optional(),
  }),
});

// Get user payment stats validation
export const getUserPaymentStatsZodSchema = z.object({
  params: z.object({
    userId: z.string({
      required_error: 'User ID is required',
    }).regex(/^\d+$/, 'User ID must be a valid number'),
  }),
  query: z.object({
    userType: z.enum(['client', 'freelancer'], {
      required_error: 'User type is required',
      invalid_type_error: 'User type must be either client or freelancer',
    }),
    dateFrom: z.string().datetime('Invalid date format for dateFrom').optional(),
    dateTo: z.string().datetime('Invalid date format for dateTo').optional(),
  }),
});

// Get onboarding link validation
export const getOnboardingLinkZodSchema = z.object({
  params: z.object({
    userId: z.string({
      required_error: 'User ID is required',
    }).regex(/^\d+$/, 'User ID must be a valid number'),
  }),
});

// Check onboarding status validation
export const checkOnboardingStatusZodSchema = z.object({
  params: z.object({
    userId: z.string({
      required_error: 'User ID is required',
    }).regex(/^\d+$/, 'User ID must be a valid number'),
  }),
});

// Webhook validation (minimal since Stripe handles most validation)
export const webhookZodSchema = z.object({
  headers: z.object({
    'stripe-signature': z.string({
      required_error: 'Stripe signature is required',
    }),
  }),
});

// Export all validation schemas
export const PaymentValidation = {
  createStripeAccount: createStripeAccountZodSchema,
  createEscrowPayment: createEscrowPaymentZodSchema,
  releasePayment: releasePaymentZodSchema,
  refundPayment: refundPaymentZodSchema,
  getPaymentById: getPaymentByIdZodSchema,
  getUserPayments: getUserPaymentsZodSchema,
  getPayments: getPaymentsZodSchema,
  getPaymentStats: getPaymentStatsZodSchema,
  getUserPaymentStats: getUserPaymentStatsZodSchema,
  getOnboardingLink: getOnboardingLinkZodSchema,
  checkOnboardingStatus: checkOnboardingStatusZodSchema,
  webhook: webhookZodSchema,
};