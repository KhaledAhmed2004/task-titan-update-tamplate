"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentValidation = exports.webhookZodSchema = exports.checkOnboardingStatusZodSchema = exports.getOnboardingLinkZodSchema = exports.getUserPaymentStatsZodSchema = exports.getPaymentStatsZodSchema = exports.getPaymentsZodSchema = exports.getUserPaymentsZodSchema = exports.getPaymentByIdZodSchema = exports.refundPaymentZodSchema = exports.releasePaymentZodSchema = exports.createEscrowPaymentZodSchema = exports.createStripeAccountZodSchema = void 0;
const zod_1 = require("zod");
// Create Stripe account validation
exports.createStripeAccountZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.number({
            required_error: 'User ID is required',
        }).positive('User ID must be positive'),
        accountType: zod_1.z.enum(['client', 'freelancer'], {
            required_error: 'Account type is required',
            invalid_type_error: 'Account type must be either client or freelancer',
        }),
    }),
});
// Create escrow payment validation
exports.createEscrowPaymentZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        bidId: zod_1.z.number({
            required_error: 'Bid ID is required',
        }).positive('Bid ID must be positive'),
        amount: zod_1.z.number({
            required_error: 'Amount is required',
        }).positive('Amount must be greater than 0').max(100000, 'Amount cannot exceed $100,000'),
        clientId: zod_1.z.number({
            required_error: 'Client ID is required',
        }).positive('Client ID must be positive'),
        freelancerId: zod_1.z.number({
            required_error: 'Freelancer ID is required',
        }).positive('Freelancer ID must be positive'),
    }),
});
// Release payment validation
exports.releasePaymentZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        paymentId: zod_1.z.string({
            required_error: 'Payment ID is required',
        }).regex(/^\d+$/, 'Payment ID must be a valid number'),
    }),
    body: zod_1.z.object({
        releaseType: zod_1.z.enum(['complete', 'partial', 'refund']).optional().default('complete'),
        amount: zod_1.z.number().positive('Amount must be greater than 0').optional(),
    }),
});
// Refund payment validation
exports.refundPaymentZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        paymentId: zod_1.z.string({
            required_error: 'Payment ID is required',
        }).regex(/^\d+$/, 'Payment ID must be a valid number'),
    }),
    body: zod_1.z.object({
        reason: zod_1.z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
    }),
});
// Get payment by ID validation
exports.getPaymentByIdZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        paymentId: zod_1.z.string({
            required_error: 'Payment ID is required',
        }).regex(/^\d+$/, 'Payment ID must be a valid number'),
    }),
});
// Get user payments validation
exports.getUserPaymentsZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string({
            required_error: 'User ID is required',
        }).regex(/^\d+$/, 'User ID must be a valid number'),
    }),
    query: zod_1.z.object({
        userType: zod_1.z.enum(['client', 'freelancer'], {
            required_error: 'User type is required',
            invalid_type_error: 'User type must be either client or freelancer',
        }),
        page: zod_1.z.string().regex(/^\d+$/, 'Page must be a valid number').optional(),
        limit: zod_1.z.string().regex(/^\d+$/, 'Limit must be a valid number').optional(),
        status: zod_1.z.enum(['pending', 'held', 'released', 'refunded']).optional(),
    }),
});
// Get payments with filters validation
exports.getPaymentsZodSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/, 'Page must be a valid number').optional(),
        limit: zod_1.z.string().regex(/^\d+$/, 'Limit must be a valid number').optional(),
        status: zod_1.z.enum(['pending', 'held', 'released', 'refunded']).optional(),
        clientId: zod_1.z.string().regex(/^\d+$/, 'Client ID must be a valid number').optional(),
        freelancerId: zod_1.z.string().regex(/^\d+$/, 'Freelancer ID must be a valid number').optional(),
        bidId: zod_1.z.string().regex(/^\d+$/, 'Bid ID must be a valid number').optional(),
        dateFrom: zod_1.z.string().datetime('Invalid date format for dateFrom').optional(),
        dateTo: zod_1.z.string().datetime('Invalid date format for dateTo').optional(),
    }),
});
// Get payment stats validation
exports.getPaymentStatsZodSchema = zod_1.z.object({
    query: zod_1.z.object({
        clientId: zod_1.z.string().regex(/^\d+$/, 'Client ID must be a valid number').optional(),
        freelancerId: zod_1.z.string().regex(/^\d+$/, 'Freelancer ID must be a valid number').optional(),
        dateFrom: zod_1.z.string().datetime('Invalid date format for dateFrom').optional(),
        dateTo: zod_1.z.string().datetime('Invalid date format for dateTo').optional(),
    }),
});
// Get user payment stats validation
exports.getUserPaymentStatsZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string({
            required_error: 'User ID is required',
        }).regex(/^\d+$/, 'User ID must be a valid number'),
    }),
    query: zod_1.z.object({
        userType: zod_1.z.enum(['client', 'freelancer'], {
            required_error: 'User type is required',
            invalid_type_error: 'User type must be either client or freelancer',
        }),
        dateFrom: zod_1.z.string().datetime('Invalid date format for dateFrom').optional(),
        dateTo: zod_1.z.string().datetime('Invalid date format for dateTo').optional(),
    }),
});
// Get onboarding link validation
exports.getOnboardingLinkZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string({
            required_error: 'User ID is required',
        }).regex(/^\d+$/, 'User ID must be a valid number'),
    }),
});
// Check onboarding status validation
exports.checkOnboardingStatusZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string({
            required_error: 'User ID is required',
        }).regex(/^\d+$/, 'User ID must be a valid number'),
    }),
});
// Webhook validation (minimal since Stripe handles most validation)
exports.webhookZodSchema = zod_1.z.object({
    headers: zod_1.z.object({
        'stripe-signature': zod_1.z.string({
            required_error: 'Stripe signature is required',
        }),
    }),
});
// Export all validation schemas
exports.PaymentValidation = {
    createStripeAccount: exports.createStripeAccountZodSchema,
    createEscrowPayment: exports.createEscrowPaymentZodSchema,
    releasePayment: exports.releasePaymentZodSchema,
    refundPayment: exports.refundPaymentZodSchema,
    getPaymentById: exports.getPaymentByIdZodSchema,
    getUserPayments: exports.getUserPaymentsZodSchema,
    getPayments: exports.getPaymentsZodSchema,
    getPaymentStats: exports.getPaymentStatsZodSchema,
    getUserPaymentStats: exports.getUserPaymentStatsZodSchema,
    getOnboardingLink: exports.getOnboardingLinkZodSchema,
    checkOnboardingStatus: exports.checkOnboardingStatusZodSchema,
    webhook: exports.webhookZodSchema,
};
