import { Types } from 'mongoose';

export const BidStatus = {
  PENDING: 'pending',
  PAYMENT_PENDING: 'payment_pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

type BidStatusType = (typeof BidStatus)[keyof typeof BidStatus];

export type Bid = {
  _id: string;
  taskId: Types.ObjectId;
  taskerId?: Types.ObjectId;
  amount: number;
  message?: string;
  status: BidStatusType;
  createdAt: Date;
  updatedAt: Date;
};

export type BidUpdate = {
  amount?: number;
  message?: string;
  status?: BidStatusType;
};

export type BidQuery = {
  taskId?: string;
  userId?: string;
  status?: BidStatusType;
};
