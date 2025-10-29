import { JwtPayload } from 'jsonwebtoken';
import { IMessage } from './message.interface';
import { Message } from './message.model';
import { Chat } from '../chat/chat.model';
import mongoose from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import QueryBuilder from '../../builder/QueryBuilder';
import { isOnline } from '../../helpers/presenceHelper';
import { incrementUnreadCount, setUnreadCount } from '../../helpers/unreadHelper';
import { sendNotifications } from '../notification/notificationsHelper';

const sendMessageToDB = async (payload: any): Promise<IMessage> => {
  // Ensure attachments is always an array
  if (!Array.isArray(payload.attachments)) {
    payload.attachments = [];
  }

  // Authorization: sender must be a participant of the chat
  const isParticipant = await Chat.exists({
    _id: payload?.chatId,
    participants: payload?.sender,
  });
  if (!isParticipant) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You are not a participant of this chat');
  }

  // save to DB
  const response = await Message.create(payload);

  //@ts-ignore
  const io = global.io;
  if (io) {
    // Room-based event for chat participants
    io.to(`chat::${String(payload?.chatId)}`).emit('MESSAGE_SENT', {
      message: response,
    });
  }

  // Offline notification triggers
  try {
    const chat = await Chat.findById(response.chatId).select('participants');
    const participants = (chat?.participants || [])
      .map(p => String(p))
      .filter(Boolean);
    const receivers = participants.filter(
      p => String(p) !== String(response.sender)
    );

    // Increment unread count for receivers
    for (const receiverId of receivers) {
      try {
        await incrementUnreadCount(String(response.chatId), String(receiverId), 1);
      } catch {}
    }

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

  // Explicitly sort by createdAt ASC for predictable ordering
  messages = messages.sort(
    (a: any, b: any) =>
      new Date(a?.createdAt as any).getTime() -
      new Date(b?.createdAt as any).getTime()
  );

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

const markChatAsRead = async (chatId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Chat ID');
  }

  // Find messages that will be marked as read
  const toUpdate = await Message.find({
    chatId,
    sender: { $ne: userId },
    readBy: { $ne: userId },
  }).select('_id chatId');

  if (!toUpdate.length) {
    return { modifiedCount: 0, updatedIds: [] } as any;
  }

  // Mark them as read for this user
  await Message.updateMany(
    { _id: { $in: toUpdate.map(m => m._id) } },
    { $addToSet: { readBy: userId } }
  );

  // Emit real-time MESSAGE_READ for each updated message to the chat room
  // @ts-ignore
  const io = global.io;
  if (io) {
    for (const msg of toUpdate) {
      io.to(`chat::${String(chatId)}`).emit('MESSAGE_READ', {
        messageId: String(msg._id),
        chatId: String(chatId),
        userId,
      });
    }
  }

  // Reset unread count cache for this user on this chat
  try {
    await setUnreadCount(String(chatId), String(userId), 0);
  } catch {}

  return { modifiedCount: toUpdate.length, updatedIds: toUpdate.map(m => String(m._id)) } as any;
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
  markChatAsRead,
  getUnreadCount,
};
