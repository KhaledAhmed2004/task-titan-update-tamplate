import mongoose from 'mongoose';
import { Bid, BidStatus } from './bid.interface';

const BidSchema = new mongoose.Schema<Bid>(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    taskerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: { type: Number, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: Object.values(BidStatus), default: BidStatus.PENDING, required: true },
  },

  {
    timestamps: true,
  }
);

// Create a unique compound index to prevent duplicate bids from the same tasker on the same task
BidSchema.index({ taskId: 1, taskerId: 1 }, { unique: true });

export const BidModel = mongoose.model<Bid>('Bid', BidSchema);
