import { Model, Types } from 'mongoose';

// Payment Status Enum
export enum PAYMENT_STATUS {
  PENDING = 'pending',
  HELD = 'held',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Business Type Enum
export enum BUSINESS_TYPE {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

// Release Type Enum
export enum RELEASE_TYPE {
  COMPLETE = 'complete',
  PARTIAL = 'partial',
  REFUND = 'refund',
}

// Account Type Enum
export enum ACCOUNT_TYPE {
  CLIENT = 'client',
  FREELANCER = 'freelancer',
}

// Currency Enum (common currencies)
export enum CURRENCY {
  USD = 'usd',
  EUR = 'eur',
  GBP = 'gbp',
  CAD = 'cad',
  AUD = 'aud',
}

// Webhook Event Types
export enum WEBHOOK_EVENT_TYPE {
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
  PAYMENT_INTENT_PAYMENT_FAILED = 'payment_intent.payment_failed',
  TRANSFER_CREATED = 'transfer.created',
  TRANSFER_UPDATED = 'transfer.updated',
  ACCOUNT_UPDATED = 'account.updated',
  PAYOUT_CREATED = 'payout.created',
  PAYOUT_FAILED = 'payout.failed',
}

// Type aliases for better readability
export type PaymentStatusType = PAYMENT_STATUS;
export type BusinessTypeType = BUSINESS_TYPE;
export type ReleaseTypeType = RELEASE_TYPE;
export type AccountTypeType = ACCOUNT_TYPE;
export type CurrencyType = CURRENCY;
export type WebhookEventType = WEBHOOK_EVENT_TYPE;

// Core Payment Interface
export type IPayment = {
  _id?: Types.ObjectId;
  taskId: Types.ObjectId;
  posterId: Types.ObjectId;
  freelancerId: Types.ObjectId;
  bidId?: Types.ObjectId;
  amount: number;
  platformFee: number;
  freelancerAmount: number;
  stripePaymentIntentId: string;
  stripeTransferId?: string;
  status: PaymentStatusType;
  currency: string;
  metadata?: Record<string, any>;
  refundReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// Stripe Account Interface
export type IStripeAccount = {
  userId: Types.ObjectId;
  accountType: AccountTypeType;
};

// Escrow Payment Interface
export type IEscrowPayment = {
  taskId: Types.ObjectId;
  amount: number;
  posterId: Types.ObjectId;
  freelancerId: Types.ObjectId;
  bidId?: Types.ObjectId;
  clientId?: Types.ObjectId;
  description?: string;
  metadata?: Record<string, any>;
};

// Payment Release Interface
export type IPaymentRelease = {
  paymentId: Types.ObjectId;
  releaseType: ReleaseTypeType;
  amount?: number;
  clientId?: Types.ObjectId;
};

// Create Payment Record Interface
export type ICreatePaymentRecord = {
  taskId: Types.ObjectId;
  posterId: Types.ObjectId;
  freelancerId: Types.ObjectId;
  amount: number;
  platformFee: number;
  freelancerAmount: number;
  stripePaymentIntentId: string;
  status: PaymentStatusType;
  currency: string;
};

// Stripe Account Info Interface
export type IStripeAccountInfo = {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  stripeAccountId: string;
  onboardingCompleted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  country?: string;
  currency: string;
  businessType: BusinessTypeType;
  createdAt?: Date;
  updatedAt?: Date;
};

// Stripe Webhook Event Interface
export type IStripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: any;
  };
};

// Payment Filters Interface
export type IPaymentFilters = {
  status?: PaymentStatusType;
  posterId?: Types.ObjectId;
  freelancerId?: Types.ObjectId;
  taskId?: Types.ObjectId;
  bidId?: Types.ObjectId;
  clientId?: Types.ObjectId;
  dateFrom?: Date;
  dateTo?: Date;
  currency?: string;
  amountMin?: number;
  amountMax?: number;
};

// Payment Statistics Interface
export type IPaymentStats = {
  totalPayments: number;
  totalAmount: number;
  totalPlatformFees: number;
  totalFreelancerPayouts: number;
  pendingPayments: number;
  completedPayments: number;
  refundedPayments: number;
  averagePayment: number;
  statusBreakdown: Record<PaymentStatusType, number>;
  monthlyTrend: Array<{
    month: string;
    totalAmount: number;
    paymentCount: number;
  }>;
};

// Payment Update Interface
export type IPaymentUpdate = {
  status?: PaymentStatusType;
  stripeTransferId?: string;
  refundReason?: string;
  metadata?: Record<string, any>;
};

// Payment Query Interface
export type IPaymentQuery = {
  taskId?: Types.ObjectId;
  posterId?: Types.ObjectId;
  freelancerId?: Types.ObjectId;
  status?: PaymentStatusType;
  currency?: string;
  dateRange?: 'recent' | 'weekly' | 'monthly' | 'yearly';
};

// Stripe Account Update Interface
export type IStripeAccountUpdate = {
  onboardingCompleted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  country?: string;
  currency?: string;
  businessType?: BusinessTypeType;
};

// Payment Model Interface (following project patterns)
export type PaymentModel = {
  isExistPaymentById(id: string): Promise<IPayment | null>;
  isExistPaymentByStripeId(stripeId: string): Promise<IPayment | null>;
  getPaymentsByUser(userId: Types.ObjectId): Promise<IPayment[]>;
  getPaymentsByTask(taskId: Types.ObjectId): Promise<IPayment[]>;
  getPaymentsByBid(bidId: Types.ObjectId): Promise<IPayment[]>;
  updatePaymentStatus(paymentId: Types.ObjectId, status: PaymentStatusType): Promise<IPayment | null>;
} & Model<IPayment>;

// Stripe Account Model Interface
export type StripeAccountModel = {
  isExistAccountByUserId(userId: Types.ObjectId): Promise<IStripeAccountInfo | null>;
  isExistAccountByStripeId(stripeId: string): Promise<IStripeAccountInfo | null>;
  updateAccountStatus(userId: Types.ObjectId, updates: IStripeAccountUpdate): Promise<IStripeAccountInfo | null>;
} & Model<IStripeAccountInfo>;