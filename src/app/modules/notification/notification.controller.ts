import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.service';
import { JwtPayload } from 'jsonwebtoken';

const getNotificationFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await NotificationService.getNotificationFromDB(
      user,
      req.query
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Notifications retrieved successfully',
      data: result,
    });
  }
);

const readNotification = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const notification = await NotificationService.markNotificationAsReadIntoDB(
    req.params.id,
    user.id
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification Read Successfully',
    data: notification,
  });
});

const readAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await NotificationService.markAllNotificationsAsRead(user.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: { updated: result.modifiedCount },
  });
});

const adminNotificationFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const result = await NotificationService.adminNotificationFromDB(req.query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Admin notifications retrieved successfully',
      data: result,
    });
  }
);

const adminMarkNotificationAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const notification =
      await NotificationService.adminMarkNotificationAsReadIntoDB(
        req.params.id
      );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Admin notification marked as read successfully',
      data: notification,
    });
  }
);

const adminMarkAllNotificationsAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const result = await NotificationService.adminMarkAllNotificationsAsRead();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: result.message,
      data: { updated: result.modifiedCount },
    });
  }
);

export const NotificationController = {
  adminNotificationFromDB,
  getNotificationFromDB,
  readAllNotifications,
  readNotification,
  adminMarkNotificationAsRead,
  adminMarkAllNotificationsAsRead,
};
