import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { TaskRoutes } from '../app/modules/task/task.route';
import { BidRoutes } from '../app/modules/bid/bid.route';
import { RatingRoutes } from '../app/modules/rating/rating.route';
import { ReportRoutes } from '../app/modules/report/report.route';
import { FaqRoutes } from '../app/modules/faq/faq.route';
import { ChatRoutes } from '../app/modules/chat/chat.route';
import { MessageRoutes } from '../app/modules/message/message.route';
import { RuleRoutes } from '../app/modules/rule/rule.route';
import { CategoryRoutes } from '../app/modules/category/category.route';
import { PaymentRoutes } from '../app/modules/payment/payment.routes';
import { BookmarkRoutes } from '../app/modules/bookmark/bookmark.route';
import { CommentRoutes } from '../app/modules/comments/comments.route';
import { NotificationRoutes } from '../app/modules/notification/notification.routes';
// import { BannerRoutes } from '../app/modules/banner/banner.route';
import { DashboardRoutes } from '../app/modules/admin/admin.route';
import { HomePageEditRoutes } from '../app/modules/homePageEdit/homePageEdit.route';

const router = express.Router();

const apiRoutes = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/tasks',
    route: TaskRoutes,
  },
  {
    path: '/',
    route: BidRoutes,
  },
  {
    path: '/ratings',
    route: RatingRoutes,
  },
  {
    path: '/reports',
    route: ReportRoutes,
  },
  {
    path: '/faqs',
    route: FaqRoutes,
  },
  {
    path: '/chats',
    route: ChatRoutes,
  },
  {
    path: '/messages',
    route: MessageRoutes,
  },
  {
    path: '/rules',
    route: RuleRoutes,
  },
  {
    path: '/categories',
    route: CategoryRoutes,
  },
  {
    path: '/payments',
    route: PaymentRoutes,
  },
  {
    path: '/bookmarks',
    route: BookmarkRoutes,
  },
  {
    path: '/comments',
    route: CommentRoutes,
  },
  {
    path: '/notifications',
    route: NotificationRoutes,
  },
  // {
  //   path: '/banners',
  //   route: BannerRoutes,
  // },
  {
    path: '/dashboard',
    route: DashboardRoutes
  },
  {
    path: '/homepage-edit',
    route: HomePageEditRoutes,
  },
  // {
  //   path: '/disputes',
  //   route: DisputeRoutes,
  // },
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
