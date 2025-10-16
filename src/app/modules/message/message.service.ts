import { JwtPayload } from 'jsonwebtoken';
import { IMessage } from './message.interface';
import { Message } from './message.model';
import { Chat } from '../chat/chat.model';
import mongoose from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import QueryBuilder from '../../builder/QueryBuilder';
import { isOnline } from '../../helpers/presenceHelper';
import { sendNotifications } from '../notification/notificationsHelper';

const sendMessageToDB = async (payload: any): Promise<IMessage> => {
  // save to DB
  const response = await Message.create(payload);

  //@ts-ignore
  const io = global.io;
  if (io) {
    // Backward-compat global event
    io.emit(`getMessage::${payload?.chatId}`, response);
    // Room-based event for chat participants
    io.to(`chat::${String(payload?.chatId)}`).emit('MESSAGE_SENT', {
      messageId: String(response._id),
      chatId: String(response.chatId),
      sender: String(response.sender),
      text: response.text,
      type: response.type,
      images: response.images,
      media: response.media,
      docs: response.docs,
      createdAt: response.createdAt,
    });
  }

  // Offline notification triggers
  try {
    const chat = await Chat.findById(response.chatId).select('participants');
    const participants = (chat?.participants || [])
      .map(p => String(p))
      .filter(Boolean);
    const receivers = participants.filter(p => String(p) !== String(response.sender));

    for (const receiverId of receivers) {
      const online = await isOnline(receiverId);
      if (!online) {
        const preview = response.text || 'New message';
        await sendNotifications({
          title: 'New Message',
          text: preview,
          receiver: receiverId,
          isRead: false,
          type: 'SYSTEM',
          referenceId: response._id,
        });
      }
    }
  } catch (err) {
    // Swallow notification errors to not block messaging
  }

  return response;
};

const getMessageFromDB = async (
  user: JwtPayload,
  id: any,
  query: Record<string, any>
): Promise<{ messages: IMessage[]; pagination: any; participant: any }> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Chat ID');
  }

  const queryBuilder = new QueryBuilder(Message.find({ chatId: id }), query)
    .search(['text'])
    .filter()
    .sort()
    .paginate()
    .fields();

  // Fetch messages
  let messages = await queryBuilder.modelQuery;

  // Reverse messages so that oldest is first if your UI appends messages top -> bottom
  messages = messages.reverse();

  // Get pagination info
  const pagination = await queryBuilder.getPaginationInfo();

  // Fetch the chat participant (exclude the logged-in user)
  const chat = await Chat.findById(id).populate({
    path: 'participants',
    select: 'name profile location',
    match: { _id: { $ne: user.id } },
  });

  const participant = chat?.participants[0] || null;

  return {
    messages,
    pagination,
    participant,
  };
};

const markAsDelivered = async (messageId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Message ID');
  }
  const updated = await Message.findByIdAndUpdate(
    messageId,
    { $addToSet: { deliveredTo: userId } },
    { new: true }
  );
  return updated;
};

const markAsReadMessage = async (messageId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Message ID');
  }
  const updated = await Message.findByIdAndUpdate(
    messageId,
    { $addToSet: { readBy: userId } },
    { new: true }
  );
  return updated;
};

const markChatAsRead = async (chatId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Chat ID');
  }
  const result = await Message.updateMany(
    { chatId, sender: { $ne: userId }, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );
  return { modifiedCount: result.modifiedCount };
};

const getUnreadCount = async (chatId: string, userId: string) => {
  const count = await Message.countDocuments({
    chatId,
    sender: { $ne: userId },
    readBy: { $ne: userId },
  });
  return count;
};

export const MessageService = {
  sendMessageToDB,
  getMessageFromDB,
  markAsDelivered,
  markAsReadMessage,
  markChatAsRead,
  getUnreadCount,
};
