import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import catchAsync from '../../../shared/catchAsync';
import { CommentService } from './comment.service';
import sendResponse from '../../../shared/sendResponse';
import { getSingleFilePath } from '../../../shared/getFilePath';

// Create new comment or reply
const createComment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = user.id;

  const image = getSingleFilePath(req.files, 'image');
  const payload = { ...req.body, userId, image };

  const result = await CommentService.createComment(payload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: payload.parentId
      ? 'Reply added successfully'
      : 'Comment added successfully',
    data: result,
  });
});

// Get comments + replies
const getCommentsByPost = catchAsync(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const result = await CommentService.getCommentsByPost(postId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Comments retrieved successfully',
    data: result,
  });
});

// Update
const updateComment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = user.id;
  const { id } = req.params;

  const image = getSingleFilePath(req.files, 'image');
  const payload = { ...req.body, image };

  const result = await CommentService.updateComment(id, userId, payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Comment updated successfully',
    data: result,
  });
});

// Delete
const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = user.id;
  const { id } = req.params;
  const result = await CommentService.deleteComment(id, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Comment deleted successfully',
    data: result,
  });
});

export const CommentController = {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};
