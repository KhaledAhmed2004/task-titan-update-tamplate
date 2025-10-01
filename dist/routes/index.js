"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_route_1 = require("../app/modules/auth/auth.route");
const user_route_1 = require("../app/modules/user/user.route");
const task_route_1 = require("../app/modules/task/task.route");
const bid_route_1 = require("../app/modules/bid/bid.route");
const rating_route_1 = require("../app/modules/rating/rating.route");
const report_route_1 = require("../app/modules/report/report.route");
const faq_route_1 = require("../app/modules/faq/faq.route");
const chat_route_1 = require("../app/modules/chat/chat.route");
const message_route_1 = require("../app/modules/message/message.route");
const rule_route_1 = require("../app/modules/rule/rule.route");
const category_route_1 = require("../app/modules/category/category.route");
const payment_routes_1 = require("../app/modules/payment/payment.routes");
const bookmark_route_1 = require("../app/modules/bookmark/bookmark.route");
const comments_route_1 = require("../app/modules/comments/comments.route");
const notification_routes_1 = require("../app/modules/notification/notification.routes");
// import { BannerRoutes } from '../app/modules/banner/banner.route';
const admin_route_1 = require("../app/modules/admin/admin.route");
const homePageEdit_route_1 = require("../app/modules/homePageEdit/homePageEdit.route");
const router = express_1.default.Router();
const apiRoutes = [
    {
        path: '/user',
        route: user_route_1.UserRoutes,
    },
    {
        path: '/auth',
        route: auth_route_1.AuthRoutes,
    },
    {
        path: '/tasks',
        route: task_route_1.TaskRoutes,
    },
    {
        path: '/',
        route: bid_route_1.BidRoutes,
    },
    {
        path: '/ratings',
        route: rating_route_1.RatingRoutes,
    },
    {
        path: '/reports',
        route: report_route_1.ReportRoutes,
    },
    {
        path: '/faqs',
        route: faq_route_1.FaqRoutes,
    },
    {
        path: '/chats',
        route: chat_route_1.ChatRoutes,
    },
    {
        path: '/messages',
        route: message_route_1.MessageRoutes,
    },
    {
        path: '/rules',
        route: rule_route_1.RuleRoutes,
    },
    {
        path: '/categories',
        route: category_route_1.CategoryRoutes,
    },
    {
        path: '/payments',
        route: payment_routes_1.PaymentRoutes,
    },
    {
        path: '/bookmarks',
        route: bookmark_route_1.BookmarkRoutes,
    },
    {
        path: '/comments',
        route: comments_route_1.CommentRoutes,
    },
    {
        path: '/notifications',
        route: notification_routes_1.NotificationRoutes,
    },
    // {
    //   path: '/banners',
    //   route: BannerRoutes,
    // },
    {
        path: '/dashboard',
        route: admin_route_1.DashboardRoutes
    },
    {
        path: '/homepage-edit',
        route: homePageEdit_route_1.HomePageEditRoutes,
    },
    // {
    //   path: '/disputes',
    //   route: DisputeRoutes,
    // },
];
apiRoutes.forEach(route => router.use(route.path, route.route));
exports.default = router;
