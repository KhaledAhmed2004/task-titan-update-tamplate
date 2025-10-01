import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';
import { TaskService } from './task.service';
import { getMultipleFilesPath } from '../../../shared/getFilePath';
import catchAsync from '../../../shared/catchAsync';
import { JwtPayload } from 'jsonwebtoken';

const createTask = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = user.id;

  const taskImage = getMultipleFilesPath(req.files, 'image');

  const task = {
    ...req.body,
    taskImage,
    userId,
  };

  const result = await TaskService.createTask(task);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Task created successfully',
    data: result,
  });
});

const getAllTasks = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = user.id;
  const query = req.query;
  const result = await TaskService.getAllTasks(query, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Tasks retrieved successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

const getTaskStatistics = catchAsync(async (_req: Request, res: Response) => {
  const result = await TaskService.getTaskStats();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Task stats retrieved successfully',
    data: result,
  });
});

const getTaskById = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const result = await TaskService.getTaskById(taskId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Task retrieved successfully',
    data: result,
  });
});

const updateTask = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const taskImages = getMultipleFilesPath(req.files, 'image');

  const payload = {
    ...req.body,
    taskImages,
  };

  const result = await TaskService.updateTask(taskId, payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Task updated successfully',
    data: result,
  });
});

const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const result = await TaskService.deleteTask(taskId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Task deleted successfully',
    data: result,
  });
});

// Get all tasks
const getMyTasks = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = user.id;
  const query = req.query;

  const result = await TaskService.getAllTasksByUser(userId, query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Your tasks retrieved successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

const getLastSixMonthsCompletionStats = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await TaskService.getLastSixMonthsCompletionStats();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Last 6 months task completion stats retrieved successfully',
      data: result,
    });
  }
);

const getMyTaskById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = user.id;
  const { taskId } = req.params;

  const result = await TaskService.getMyTaskById(userId, taskId);

  res.status(200).json({
    success: true,
    message: 'Task retrieved successfully',
    data: result,
  });
});

// Complete task and release payment
const completeTask = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const clientId = user.id;
  const { taskId } = req.params;

  const result = await TaskService.completeTask(taskId, clientId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Task completed successfully and payment released',
    data: result,
  });
});

const cancelTask = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const user = req.user as JwtPayload;
  const userId = user.id;
  const { reason } = req.body;

  const result = await TaskService.cancelTask(taskId, userId, reason);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Task cancelled successfully',
    data: result,
  });
});

// Submit delivery (Tasker)
const submitDelivery = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const taskerId = user.id;
  const { taskId } = req.params;

  const result = await TaskService.submitDelivery(taskId, taskerId);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Delivery submitted successfully. Awaiting review.',
    data: result,
  });
});

const getSimilarTasks = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const result = await TaskService.getSimilarTasks(taskId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Similar tasks retrieved successfully',
    data: result,
  });
});

export const TaskController = {
  createTask,
  getTaskStatistics,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getMyTasks,
  getLastSixMonthsCompletionStats,
  getMyTaskById,
  completeTask,
  cancelTask,
  submitDelivery,
  getSimilarTasks,
};
