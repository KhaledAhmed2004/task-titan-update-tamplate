import { JwtPayload } from 'jsonwebtoken';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';
import QueryBuilder from '../../builder/QueryBuilder';

// get notifications
const getNotificationFromDB = async (
  user: JwtPayload,
  query: Record<string, unknown>
) => {
  // 1️⃣ Initialize QueryBuilder for user's notifications
  const notificationQuery = new QueryBuilder<INotification>(
    Notification.find({ receiver: user.id }),
    query
  )
    .search(['title', 'text'])
    .filter()
    .dateFilter()
    .sort()
    .paginate()
    .fields();

  // 2️⃣ Execute the query and get filtered & paginated results
  const { data, pagination } = await notificationQuery.getFilteredResults();

  // 3️⃣ Count unread notifications separately
  const unreadCount = await Notification.countDocuments({
    receiver: user.id,
    isRead: false,
  });

  // 4️⃣ Return structured response
  return {
    data,
    pagination,
    unreadCount,
  };
};

const markNotificationAsReadIntoDB = async (
  notificationId: string,
  userId: string
) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, receiver: userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new Error('Notification not found');
  }

  return notification;
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const result = await Notification.updateMany(
    { receiver: userId, isRead: false }, // only unread notifications
    { isRead: true }
  );

  return {
    modifiedCount: result.modifiedCount, // number of notifications updated
    message: 'All notifications marked as read',
  };
};

// Fetch admin notifications with query, pagination, unread count
const adminNotificationFromDB = async (query: Record<string, unknown>) => {
  const notificationQuery = new QueryBuilder<INotification>(
    Notification.find({ type: 'ADMIN' }),
    query
  )
    .search(['title', 'text'])
    .filter()
    .dateFilter()
    .sort()
    .paginate()
    .fields();

  const { data, pagination } = await notificationQuery.getFilteredResults();

  const unreadCount = await Notification.countDocuments({
    type: 'ADMIN',
    isRead: false,
  });

  return {
    data,
    pagination,
    unreadCount,
  };
};

// Mark a single admin notification as read
const adminMarkNotificationAsReadIntoDB = async (notificationId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, type: 'ADMIN' },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new Error('Admin notification not found');
  }

  return notification;
};

// Mark all admin notifications as read
const adminMarkAllNotificationsAsRead = async () => {
  const result = await Notification.updateMany(
    { type: 'ADMIN', isRead: false },
    { isRead: true }
  );

  return {
    modifiedCount: result.modifiedCount,
    message: 'All admin notifications marked as read',
  };
};

export const NotificationService = {
  adminNotificationFromDB,
  getNotificationFromDB,
  markNotificationAsReadIntoDB,
  adminMarkNotificationAsReadIntoDB,
  markAllNotificationsAsRead,
  adminMarkAllNotificationsAsRead,
};
