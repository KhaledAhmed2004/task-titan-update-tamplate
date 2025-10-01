import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import { USER_STATUS } from '../../../enums/user';
import { JwtPayload } from 'jsonwebtoken';

const createUser = catchAsync(async (req: Request, res: Response) => {
  const { ...userData } = req.body;
  const result = await UserService.createUserToDB(userData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'User created successfully',
    data: result,
  });
});

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.getUserProfileFromDB(user as JwtPayload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile data retrieved successfully',
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  let image = getSingleFilePath(req.files, 'image');

  const data = {
    image,
    ...req.body,
  };
  const result = await UserService.updateProfileToDB(user as JwtPayload, data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Users retrieved successfully',
    pagination: result.pagination,
    data: result.data,
  });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUserStats();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User stats retrieved successfully',
    data: result,
  });
});

const blockUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.updateUserStatus(id, USER_STATUS.RESTRICTED);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User blocked successfully',
    data: result,
  });
});

const unblockUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.updateUserStatus(id, USER_STATUS.ACTIVE);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User unblocked successfully',
    data: result,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await UserService.getUserById(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User data retrieved successfully',
    data: result,
  });
});

const getUserDistribution = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUserDistribution();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User distribution retrieved successfully',
    data: result,
  });
});

const getUserDetailsById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await UserService.getUserDetailsById(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User details retrieved successfully',
    data: result,
  });
});

export const UserController = {
  createUser,
  getUserProfile,
  updateProfile,
  getAllUsers,
  blockUser,
  unblockUser,
  getUserById,
  getUserStats,
  getUserDistribution,
  getUserDetailsById,
};
