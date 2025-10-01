import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { ChatService } from './chat.service';
import { JwtPayload } from 'jsonwebtoken';

const createChat = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const otherUser = req.params.id;

  const participants = [user?.id, otherUser];
  console.log('participants', participants);
  const chat = await ChatService.createChatToDB(participants);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Create Chat Successfully',
    data: chat,
  });
});

const getChat = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const search = req.query.search as string;
  const chatList = await ChatService.getChatFromDB(user, search);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Chat Retrieve Successfully',
    data: chatList,
  });
});

export const ChatController = {
  createChat,
  getChat,
};
