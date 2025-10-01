import { Schema, model } from 'mongoose';
import { IMessage, MessageModel } from './message.interface';

const messageSchema = new Schema<IMessage, MessageModel>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Chat',
    },
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    text: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'media', 'doc', 'mixed'],
      default: 'text',
    },
    images: { type: [String], default: [] },
    media: { type: [String], default: [] },
    docs: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export const Message = model<IMessage, MessageModel>('Message', messageSchema);
