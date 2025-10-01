import { Types } from 'mongoose';

export interface IComment {
  _id?: Types.ObjectId;
  postId: Types.ObjectId; // kon post/article er under e comment
  userId: Types.ObjectId; // kon user comment koreche
  comment: string; // comment text
  parentId?: Types.ObjectId | null; // reply hole parent comment er id
  image?: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
