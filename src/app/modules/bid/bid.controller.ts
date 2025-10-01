import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';
import { BidUpdate } from './bid.interface';
import { BidService } from './bid.service';
import { JwtPayload } from 'jsonwebtoken';
import catchAsync from '../../../shared/catchAsync';

const createBid = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const user = req?.user as JwtPayload;
  const taskerId = user.id;
  const bidData = req.body;
  bidData.taskId = taskId;
  bidData.taskerId = taskerId;

  const result = await BidService.createBid(bidData, taskerId);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Bid created successfully',
    data: result,
  });
});

const getAllTasksByTaskerBids = catchAsync(
  async (req: Request, res: Response) => {
    const user = req?.user as JwtPayload;
    const taskerId = user.id;

    const result = await BidService.getAllTasksByTaskerBids(
      taskerId,
      req.query
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Tasks with your bids retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  }
);

const updateBid = catchAsync(async (req: Request, res: Response) => {
  const { bidId } = req.params;
  const user = req?.user as JwtPayload;
  const taskerId = user.id;
  const bidUpdate: BidUpdate = req.body;

  const result = await BidService.updateBid(bidId, taskerId, bidUpdate);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bid updated successfully',
    data: result,
  });
});

const deleteBid = catchAsync(async (req: Request, res: Response) => {
  const { bidId } = req.params;
  const user = req?.user as JwtPayload;
  const taskerId = user.id;

  const result = await BidService.deleteBid(bidId, taskerId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bid deleted successfully',
    data: result,
  });
});

const getAllBidsByTaskId = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const result = await BidService.getAllBidsByTaskId(taskId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.data.length
      ? 'Bids for task retrieved successfully'
      : 'No bids found for this task',
    data: result.data,
    pagination: result.pagination,
  });
});

const getBidById = catchAsync(async (req: Request, res: Response) => {
  const { bidId } = req.params;
  const result = await BidService.getBidById(bidId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bid retrieved successfully',
    data: result,
  });
});

const acceptBid = catchAsync(async (req: Request, res: Response) => {
  const { bidId } = req.params;
  const user = req?.user as JwtPayload;
  const clientId = user.id;

  const result = await BidService.acceptBid(bidId, clientId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bid accepted successfully',
    data: result,
  });
});

export const BidController = {
  createBid,
  getAllBidsByTaskId,
  getBidById,
  updateBid,
  deleteBid,
  acceptBid,
  getAllTasksByTaskerBids,
};
