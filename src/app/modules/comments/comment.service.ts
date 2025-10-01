import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IComment } from './comment.interface';
import { Comment } from './comment.model';
import unlinkFile from '../../../shared/unlinkFile';
import mongoose from 'mongoose';

// Create comment / reply
const createComment = async (payload: IComment) => {
  // If reply -> check parentId exists
  if (payload.parentId) {
    const parentExists = await Comment.findOne({
      _id: payload.parentId,
      isDeleted: false,
    });
    if (!parentExists) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid parent comment');
    }
  }
  return await Comment.create(payload);
};

// Get comments for a post with replies
const getCommentsByPost = async (postId: string) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Post ID');
  }

  // root comments only
  const comments = await Comment.find({
    postId,
    parentId: null,
    isDeleted: false,
  })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

  // replies fetch
  const commentsWithReplies = await Promise.all(
    comments.map(async comment => {
      const replies = await Comment.find({
        parentId: comment._id,
        isDeleted: false,
      })
        .populate('userId', 'name email')
        .sort({ createdAt: 1 });

      return { ...comment.toObject(), replies };
    })
  );

  return commentsWithReplies;
};

// Update comment
const updateComment = async (
  id: string,
  userId: string,
  payload: Partial<IComment>
) => {
  const comment = await Comment.findOne({ _id: id, userId, isDeleted: false });
  if (!comment) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Comment not found or unauthorized'
    );
  }

  // new image replace
  if (payload.image && comment.image) {
    unlinkFile(comment.image);
  }

  comment.comment = payload.comment ?? comment.comment;
  if (payload.image) {
    comment.image = payload.image;
  }
  await comment.save();

  return comment;
};

// Soft delete comment
const deleteComment = async (id: string, userId: string) => {
  const comment = await Comment.findOne({ _id: id, userId, isDeleted: false });
  if (!comment) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Comment not found or unauthorized'
    );
  }

  if (comment.image) {
    unlinkFile(comment.image);
  }

  comment.isDeleted = true;
  await comment.save();
  return comment;
};

export const CommentService = {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};
