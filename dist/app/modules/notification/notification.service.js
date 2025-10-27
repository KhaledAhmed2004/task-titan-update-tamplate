"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = exports.markAllNotificationsAsRead = void 0;
const notification_model_1 = require("./notification.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
// get notifications
const getNotificationFromDB = (user, query) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Initialize QueryBuilder for user's notifications
    const notificationQuery = new QueryBuilder_1.default(notification_model_1.Notification.find({ receiver: user.id }), query)
        .search(['title', 'text'])
        .filter()
        .dateFilter()
        .sort()
        .paginate()
        .fields();
    // 2️⃣ Execute the query and get filtered & paginated results
    const { data, pagination } = yield notificationQuery.getFilteredResults();
    // 3️⃣ Count unread notifications separately
    const unreadCount = yield notification_model_1.Notification.countDocuments({
        receiver: user.id,
        isRead: false,
    });
    // 4️⃣ Return structured response
    return {
        data,
        pagination,
        unreadCount,
    };
});
const markNotificationAsReadIntoDB = (notificationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.Notification.findOneAndUpdate({ _id: notificationId, receiver: userId }, { isRead: true }, { new: true });
    if (!notification) {
        throw new Error('Notification not found');
    }
    return notification;
});
const markAllNotificationsAsRead = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.updateMany({ receiver: userId, isRead: false }, // only unread notifications
    { isRead: true });
    return {
        modifiedCount: result.modifiedCount, // number of notifications updated
        message: 'All notifications marked as read',
    };
});
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Fetch admin notifications with query, pagination, unread count
const adminNotificationFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const notificationQuery = new QueryBuilder_1.default(notification_model_1.Notification.find({ type: 'ADMIN' }), query)
        .search(['title', 'text'])
        .filter()
        .dateFilter()
        .sort()
        .paginate()
        .fields();
    const { data, pagination } = yield notificationQuery.getFilteredResults();
    const unreadCount = yield notification_model_1.Notification.countDocuments({
        type: 'ADMIN',
        isRead: false,
    });
    return {
        data,
        pagination,
        unreadCount,
    };
});
// Mark a single admin notification as read
const adminMarkNotificationAsReadIntoDB = (notificationId) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.Notification.findOneAndUpdate({ _id: notificationId, type: 'ADMIN' }, { isRead: true }, { new: true });
    if (!notification) {
        throw new Error('Admin notification not found');
    }
    return notification;
});
// Mark all admin notifications as read
const adminMarkAllNotificationsAsRead = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.updateMany({ type: 'ADMIN', isRead: false }, { isRead: true });
    return {
        modifiedCount: result.modifiedCount,
        message: 'All admin notifications marked as read',
    };
});
exports.NotificationService = {
    adminNotificationFromDB,
    getNotificationFromDB,
    markNotificationAsReadIntoDB,
    adminMarkNotificationAsReadIntoDB,
    markAllNotificationsAsRead: exports.markAllNotificationsAsRead,
    adminMarkAllNotificationsAsRead,
};
