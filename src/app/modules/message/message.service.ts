import { JwtPayload } from 'jsonwebtoken';
import { IMessage } from './message.interface';
import { Message } from './message.model';
import { Chat } from '../chat/chat.model';
import mongoose from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import QueryBuilder from '../../builder/QueryBuilder';

const sendMessageToDB = async (payload: any): Promise<IMessage> => {
  // save to DB
  const response = await Message.create(payload);

  //@ts-ignore
  const io = global.io;
  if (io) {
    io.emit(`getMessage::${payload?.chatId}`, response);
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

export const MessageService = { sendMessageToDB, getMessageFromDB };
