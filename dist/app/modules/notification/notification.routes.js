"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const notification_controller_1 = require("./notification.controller");
const router = express_1.default.Router();
// Fetch notifications + unread count
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.TASKER, user_1.USER_ROLES.POSTER), notification_controller_1.NotificationController.getNotificationFromDB);
// Mark a notification as read
router.patch('/:id/read', (0, auth_1.default)(user_1.USER_ROLES.TASKER, user_1.USER_ROLES.POSTER), notification_controller_1.NotificationController.readNotification);
// Mark all notifications as read
router.patch('/read-all', (0, auth_1.default)(user_1.USER_ROLES.TASKER, user_1.USER_ROLES.POSTER), notification_controller_1.NotificationController.readAllNotifications);
// Fetch admin notifications + unread count
router.get('/admin', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), notification_controller_1.NotificationController.adminNotificationFromDB);
// Mark a single admin notification as read
router.patch('/admin/:id/read', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), notification_controller_1.NotificationController.adminMarkNotificationAsRead);
// Mark all admin notifications as read
router.patch('/admin/read-all', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), notification_controller_1.NotificationController.adminMarkAllNotificationsAsRead);
exports.NotificationRoutes = router;
