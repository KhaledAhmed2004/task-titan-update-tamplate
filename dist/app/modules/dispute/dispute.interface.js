"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputePriority = exports.DisputeResolution = exports.DisputeType = exports.DisputeStatus = void 0;
exports.DisputeStatus = {
    OPEN: 'open',
    UNDER_REVIEW: 'under_review',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
};
exports.DisputeType = {
    DELIVERY_REJECTED: 'delivery_rejected',
    PAYMENT_ISSUE: 'payment_issue',
    TASK_CANCELLATION: 'task_cancellation',
    QUALITY_ISSUE: 'quality_issue',
    COMMUNICATION_ISSUE: 'communication_issue',
    OTHER: 'other',
};
exports.DisputeResolution = {
    REFUND_POSTER: 'refund_poster',
    RELEASE_TO_FREELANCER: 'release_to_freelancer',
    SPLIT_PAYMENT: 'split_payment',
    PARTIAL_REFUND: 'partial_refund',
    NO_ACTION: 'no_action',
};
exports.DisputePriority = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
};
