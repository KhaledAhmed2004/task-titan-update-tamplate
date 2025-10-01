import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from '../../../shared/catchAsync';
import { DashboardService } from './admin.service';

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const dashboardStats = await DashboardService.getDashboardStats();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Dashboard stats fetched successfully',
    data: dashboardStats,
  });
});

const getMonthlyRevenue = catchAsync(async (_req: Request, res: Response) => {
  const revenueByMonth = await DashboardService.getMonthlyRevenue();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Monthly revenue fetched successfully',
    data: revenueByMonth,
  });
});

export const DashboardController = {
  getDashboardStats,
  getMonthlyRevenue,
};
