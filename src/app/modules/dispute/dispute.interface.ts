import { Types } from 'mongoose';

export const DisputeStatus = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export type DisputeStatusType =
  (typeof DisputeStatus)[keyof typeof DisputeStatus];

export const DisputeType = {
  DELIVERY_REJECTED: 'delivery_rejected',
  PAYMENT_ISSUE: 'payment_issue',
  TASK_CANCELLATION: 'task_cancellation',
  QUALITY_ISSUE: 'quality_issue',
  COMMUNICATION_ISSUE: 'communication_issue',
  OTHER: 'other',
} as const;

export type DisputeTypeType = (typeof DisputeType)[keyof typeof DisputeType];

export const DisputeResolution = {
  REFUND_POSTER: 'refund_poster',
  RELEASE_TO_FREELANCER: 'release_to_freelancer',
  SPLIT_PAYMENT: 'split_payment',
  PARTIAL_REFUND: 'partial_refund',
  NO_ACTION: 'no_action',
} as const;

export type DisputeResolutionType =
  (typeof DisputeResolution)[keyof typeof DisputeResolution];

export const DisputePriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type DisputePriorityType =
  (typeof DisputePriority)[keyof typeof DisputePriority];

export interface IDispute {
  _id?: Types.ObjectId;
  taskId: Types.ObjectId;
  posterId: Types.ObjectId;
  freelancerId: Types.ObjectId;
  bidId: Types.ObjectId;
  paymentId?: Types.ObjectId;
  type: DisputeTypeType;
  status: DisputeStatusType;
  priority: DisputePriorityType;
  title: string;
  description: string;
  posterClaim: string;
  freelancerResponse?: string;
  adminNotes?: string;
  resolution?: DisputeResolutionType;
  resolutionDetails?: string;
  refundAmount?: number;
  releaseAmount?: number;
  platformFee?: number;
  resolvedBy?: Types.ObjectId; // Admin who resolved
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDisputeCreate {
  taskId: string;
  type: DisputeTypeType;
  title: string;
  description: string;
  posterClaim: string;
  deliveryId?: string;
}

export interface IDisputeUpdate {
  status?: DisputeStatusType;
  priority?: DisputePriorityType;
  freelancerResponse?: string;
  adminNotes?: string;
  resolution?: DisputeResolutionType;
  resolutionDetails?: string;
  refundAmount?: number;
  releaseAmount?: number;
}

export interface IDisputeQuery {
  taskId?: string;
  posterId?: string;
  freelancerId?: string;
  type?: DisputeTypeType;
  status?: DisputeStatusType;
  priority?: DisputePriorityType;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IDisputeResolutionRequest {
  disputeId: string;
  resolution: DisputeResolutionType;
  resolutionDetails: string;
  refundAmount?: number;
  releaseAmount?: number;
  adminNotes?: string;
}

export interface IDisputeResponse {
  disputeId: string;
  response: string;
}

export interface IDisputeStats {
  total: number;
  byStatus: { [key in DisputeStatusType]: number };
  byType: { [key in DisputeTypeType]: number };
  byPriority: { [key in DisputePriorityType]: number };
  avgResolutionTime: number; // in hours
  resolutionRate: number; // percentage
}

export interface IDisputeEscalation {
  disputeId: string;
  reason: string;
  escalatedBy: Types.ObjectId;
  escalatedAt: Date;
  previousPriority: DisputePriorityType;
  newPriority: DisputePriorityType;
}
