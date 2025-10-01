import { Schema, model } from 'mongoose';
import { IBookmark } from './bookmark.interface';

const bookmarkSchema = new Schema<IBookmark>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate bookmarks (same user cannot bookmark same job twice)
bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });

export const Bookmark = model<IBookmark>('Bookmark', bookmarkSchema);
