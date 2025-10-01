import mongoose, { Schema } from 'mongoose';
import { Task, TaskStatus } from './task.interface';

const TaskSchema = new mongoose.Schema<Task>(
  {
    title: {
      type: String,
      required: true,
    },
    taskCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    taskImage: { type: [String], default: [] },
    taskBudget: {
      type: Number,
      required: true,
    },
    taskLocation: {
      type: String,
      required: true,
    },
    latitude: { type: Number },
    longitude: { type: Number },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.OPEN,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    paymentIntentId: {
      type: String,
      required: false,
    },
    ratings: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Rating',
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const TaskModel = mongoose.model<Task>('Task', TaskSchema);
