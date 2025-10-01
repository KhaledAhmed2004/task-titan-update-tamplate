import { Model, Types } from 'mongoose';

export type NotificationType =
  | 'ADMIN'
  | 'BID'
  | 'BID_ACCEPTED'
  | 'BOOKING'
  | 'TASK'
  | 'SYSTEM'
  | 'DELIVERY_SUBMITTED'
  | 'PAYMENT_PENDING';

export type INotification = {
  text: string;
  receiver: Types.ObjectId;
  title?: string;
  isRead: boolean;
  type?: NotificationType;
  referenceId?: Types.ObjectId;
};

export type NotificationModel = Model<INotification>;
