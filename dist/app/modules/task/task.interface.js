"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatus = void 0;
const TaskStatus = {
    OPEN: 'open', // Task created, accepting bids
    IN_PROGRESS: 'in_progress', // Bid accepted, freelancer working
    UNDER_REVIEW: 'under_review', // Delivery submitted, awaiting review
    COMPLETED: 'completed', // Delivery accepted, payment released
    CANCELLED: 'cancelled', // Task cancelled by poster
    DISPUTED: 'disputed', // In dispute resolution
};
exports.TaskStatus = TaskStatus;
