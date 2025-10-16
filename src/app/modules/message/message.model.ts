import { Schema, model } from 'mongoose';
import { IMessage, MessageModel } from './message.interface';

const messageSchema = new Schema<IMessage, MessageModel>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Chat',
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    text: {
      type: String,
      required: false,
      maxlength: 1000,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'media', 'doc', 'mixed'],
      default: 'text',
    },
    images: { type: [String], default: [] },
    media: { type: [String], default: [] },
    docs: { type: [String], default: [] },
    deliveredTo: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    editedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

export const Message = model<IMessage, MessageModel>('Message', messageSchema);
