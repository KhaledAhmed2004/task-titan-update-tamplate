import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { NotificationController } from './notification.controller';
const router = express.Router();

// Fetch notifications + unread count
router.get(
  '/',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  NotificationController.getNotificationFromDB
);

// Mark a notification as read
router.patch(
  '/:id/read',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  NotificationController.readNotification
);

// Mark all notifications as read
router.patch(
  '/read-all',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  NotificationController.readAllNotifications
);

// Fetch admin notifications + unread count
router.get(
  '/admin',
  auth(USER_ROLES.SUPER_ADMIN),
  NotificationController.adminNotificationFromDB
);

// Mark a single admin notification as read
router.patch(
  '/admin/:id/read',
  auth(USER_ROLES.SUPER_ADMIN),
  NotificationController.adminMarkNotificationAsRead
);

// Mark all admin notifications as read
router.patch(
  '/admin/read-all',
  auth(USER_ROLES.SUPER_ADMIN),
  NotificationController.adminMarkAllNotificationsAsRead
);

export const NotificationRoutes = router;
