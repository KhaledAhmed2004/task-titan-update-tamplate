import { Model, Types } from 'mongoose';

export type AttachmentType = 'image' | 'audio' | 'video' | 'file';

export type IMessageAttachment = {
  type: AttachmentType;
  url: string;
  name?: string;
  size?: number;
  mime?: string;
  width?: number;
  height?: number;
  duration?: number; // for audio/video
};

export type IMessage = {
  chatId: Types.ObjectId;
  sender: Types.ObjectId;
  text?: string;
  type: 'text' | 'image' | 'media' | 'doc' | 'mixed';
  attachments?: IMessageAttachment[]; // unified attachment system
  deliveredTo?: Types.ObjectId[];
  readBy?: Types.ObjectId[];
  status?: 'sent' | 'delivered' | 'seen';
  editedAt?: Date;
};

export type MessageModel = Model<IMessage>;
