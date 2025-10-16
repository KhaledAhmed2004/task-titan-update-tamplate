import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { MessageService } from './message.service';
import { JwtPayload } from 'jsonwebtoken';

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const message = await MessageService.sendMessageToDB(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Send Message Successfully',
    data: message,
  });
});

const getMessage = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const messages = await MessageService.getMessageFromDB(
    req.user as JwtPayload,
    id,
    req.query
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Message Retrieve Successfully',
    data: messages,
  });
});

export const MessageController = { sendMessage, getMessage };

const markMessageRead = catchAsync(async (req: Request, res: Response) => {
  const messageId = req.params.id;
  const userId = (req.user as JwtPayload).id as string;
  const updated = await MessageService.markAsReadMessage(messageId, userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Message marked as read',
    data: updated,
  });
});

const markChatRead = catchAsync(async (req: Request, res: Response) => {
  const chatId = req.params.chatId;
  const userId = (req.user as JwtPayload).id as string;
  const result = await MessageService.markChatAsRead(chatId, userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Chat messages marked as read',
    data: result,
  });
});

export const MessageExtraController = { markMessageRead, markChatRead };
