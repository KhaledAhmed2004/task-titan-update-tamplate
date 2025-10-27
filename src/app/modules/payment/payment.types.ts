import { Types } from 'mongoose';

// Payment Status Enum
export enum PAYMENT_STATUS {
  PENDING = 'pending',
  HELD = 'held',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Release Type Enum
export enum RELEASE_TYPE {
  COMPLETE = 'complete',
  PARTIAL = 'partial',
  REFUND = 'refund',
}

// // Account Type Enum
// export enum ACCOUNT_TYPE {
//   CLIENT = 'client',
//   FREELANCER = 'freelancer',
// }

// Currency Enum (common currencies)
export enum CURRENCY {
  USD = 'usd',
  EUR = 'eur',
  GBP = 'gbp',
  CAD = 'cad',
  AUD = 'aud',
}

// Type aliases for better readability
export type PaymentStatusType = PAYMENT_STATUS;
export type ReleaseTypeType = RELEASE_TYPE;
// export type AccountTypeType = ACCOUNT_TYPE;
export type CurrencyType = CURRENCY;

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

export type IPaymentView = IPayment & {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
};
