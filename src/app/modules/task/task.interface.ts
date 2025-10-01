import { Types } from 'mongoose';

const TaskStatus = {
  OPEN: 'open', // Task created, accepting bids
  IN_PROGRESS: 'in_progress', // Bid accepted, freelancer working
  UNDER_REVIEW: 'under_review', // Delivery submitted, awaiting review
  COMPLETED: 'completed', // Delivery accepted, payment released
  CANCELLED: 'cancelled', // Task cancelled by poster
  DISPUTED: 'disputed', // In dispute resolution
} as const;

export { TaskStatus };

// Type helper
type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export type Task = {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  taskCategory: Types.ObjectId;
  description: string;
  taskImage?: string[];
  taskBudget: number;
  taskLocation: string;
  latitude: number; 
  longitude: number; 
  status: TaskStatusType;
  userId: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  ratings?: Types.ObjectId[];
  isDeleted: boolean;
  paymentIntentId?: string; // Stripe payment intent ID for escrow
};

export type TaskUpdate = {
  title?: string;
  taskCategory?: string;
  description?: string;
  taskImage?: string;
  taskBudget?: number;
  taskLocation?: string;
  dueDate?: string;
  status?: TaskStatusType;
};

export type TaskQuery = {
  userId?: string;
  status?: TaskStatusType;
  taskCategory?: string;
  taskLocation?: string;
  timeRange?: 'recent' | 'weekly' | 'monthly';
};
