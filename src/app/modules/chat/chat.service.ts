import { IMessage } from '../message/message.interface';
import { Message } from '../message/message.model';
import { IChat } from './chat.interface';
import { Chat } from './chat.model';

const createChatToDB = async (payload: any): Promise<IChat> => {
  const isExistChat: IChat | null = await Chat.findOne({
    participants: { $all: payload },
  });

  if (isExistChat) {
    return isExistChat;
  }
  const chat: IChat = await Chat.create({ participants: payload });
  return chat;
};

const getChatFromDB = async (user: any, search: string): Promise<IChat[]> => {
  const chats: any = await Chat.find({ participants: { $in: [user.id] } })
    .populate({
      path: 'participants',
      select: '_id name image',
      match: {
        _id: { $ne: user.id }, // Exclude user.id in the populated participants
        ...(search && { name: { $regex: search, $options: 'i' } }), // Apply $regex only if search is valid
      },
    })
    .select('participants status');

  // Filter out chats where no participants match the search (empty participants)
  const filteredChats = chats?.filter(
    (chat: any) => chat?.participants?.length > 0
  );

  //Use Promise.all to handle the asynchronous operations inside the map
  const chatList: IChat[] = await Promise.all(
    filteredChats?.map(async (chat: any) => {
      const data = chat?.toObject();

      const lastMessage: IMessage | null = await Message.findOne({
        chatId: chat?._id,
      })
        .sort({ createdAt: -1 })
        .select('text offer createdAt sender');

      return {
        ...data,
        lastMessage: lastMessage || null,
      };
    })
  );

  return chatList;
};

export const ChatService = { createChatToDB, getChatFromDB };
