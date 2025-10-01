import mongoose, { Schema } from 'mongoose';
import { INotification } from './notification.interface';

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String },
    text: { type: String, required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isRead: { type: Boolean, default: false },
    type: {
      type: String,
      enum: [
        'ADMIN',
        'BID',
        'BOOKING',
        'TASK',
        'BID_ACCEPTED',
        'SYSTEM',
        'DELIVERY_SUBMITTED',
        'PAYMENT_PENDING',
      ],
      default: 'SYSTEM',
    },
    referenceId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);
