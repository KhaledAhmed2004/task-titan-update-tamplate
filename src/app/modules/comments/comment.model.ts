import { Schema, model } from 'mongoose';
import { IComment } from './comment.interface';

const commentSchema = new Schema<IComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null }, // reply support
    image: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Comment = model<IComment>('Comment', commentSchema);
