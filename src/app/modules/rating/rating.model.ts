import mongoose, { Schema, Model } from 'mongoose';
import { IRating } from './rating.interface';

const ratingSchema: Schema<IRating> = new Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    givenTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Optional: Ensure one user cannot rate same task multiple times
ratingSchema.index({ taskId: 1, givenBy: 1 }, { unique: true });

export const Rating: Model<IRating> = mongoose.model<IRating>(
  'Rating',
  ratingSchema
);
