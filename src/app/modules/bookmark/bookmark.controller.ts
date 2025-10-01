import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { BookmarkService } from './bookmark.service';
import { JwtPayload } from 'jsonwebtoken';

// Toggle bookmark (add if not exists, remove if exists)
const toggleBookmark = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = user.id;
  const { postId } = req.body;

  const result = await BookmarkService.toggleBookmarkIntoDB(userId, postId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result.bookmark,
  });
});

// Fetch All bookmarks of current user
const getUserBookmarks = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = user.id;
  const result = await BookmarkService.getUserBookmarksFromDB(
    userId,
    req.query
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bookmarks retrieved successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

export const BookmarkController = {
  toggleBookmark,
  getUserBookmarks,
};
