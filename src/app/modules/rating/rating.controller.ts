import { Request, Response } from 'express';
import { RatingService } from './rating.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from '../../../shared/catchAsync';
import { JwtPayload } from 'jsonwebtoken';

const createRating = catchAsync(async (req: Request, res: Response) => {
  const user = req?.user as JwtPayload;
  const userId = user?.id;
  const data = {
    taskId: req.body.taskId,
    givenBy: userId,
    givenTo: req.body.givenTo,
    rating: req.body.rating,
    message: req.body.message,
  };

  const result = await RatingService.createRating(data);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: 'Rating created successfully',
    data: result,
  });
});

const getAllRatings = catchAsync(async (req: Request, res: Response) => {
  const result = await RatingService.getAllRatings(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: result,
  });
});

const getMyRatings = catchAsync(async (req: Request, res: Response) => {
  const user = req?.user as JwtPayload;
  const userId = user?.id;
  const result = await RatingService.getMyRatings(userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: result,
  });
});

const getMyRatingStats = catchAsync(async (req: Request, res: Response) => {
  const user = req?.user as JwtPayload;
  const userId = user?.id;
  const result = await RatingService.getMyRatingStats(userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: result,
  });
});

const getSingleRating = catchAsync(async (req: Request, res: Response) => {
  const result = await RatingService.getSingleRating(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: result,
  });
});

const updateRating = catchAsync(async (req: Request, res: Response) => {
  const result = await RatingService.updateRating(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Rating updated successfully',
    data: result,
  });
});

const deleteRating = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = user?.id;

  const result = await RatingService.deleteRating(req.params.id, userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Rating deleted successfully',
    data: result,
  });
});

const getUserRatings = catchAsync(async (req: Request, res: Response) => {
  const result = await RatingService.getUserRatings(req.params.userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: result,
  });
});

const getUserRatingStats = catchAsync(async (req: Request, res: Response) => {
  const result = await RatingService.getUserRatingStats(req.params.userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: result,
  });
});

const getTaskRatings = catchAsync(async (req: Request, res: Response) => {
  const result = await RatingService.getTaskRatings(req.params.taskId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: result,
  });
});

export const RatingController = {
  createRating,
  getAllRatings,
  getSingleRating,
  updateRating,
  deleteRating,
  getUserRatings,
  getTaskRatings,
  getUserRatingStats,
  getMyRatings,
  getMyRatingStats,
};
