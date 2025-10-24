import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import ApiError from '../../errors/ApiError';
import handleValidationError from '../../errors/handleValidationError';
import handleZodError from '../../errors/handleZodError';
import handleCastError from '../../errors/handleCastError';
import { errorLogger } from '../../shared/logger';
import { IErrorMessage } from '../../types/errors.types';

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // config.node_env === 'development'
  //   ? console.log('🚨 globalErrorHandler ~~ ', error)
  //   : errorLogger.error('🚨 globalErrorHandler ~~ ', error);
  errorLogger.error('🚨 globalErrorHandler ~~ ', error);

  let statusCode = 500;
  let message = 'Something went wrong';
  let errorMessages: IErrorMessage[] = [];

  if (error.name === 'ZodError') {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error.name === 'ValidationError') {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error.name === 'CastError') {
    const simplifiedError = handleCastError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (
    error.name === 'MongoServerError' &&
    (error as any).code === 11000
  ) {
    statusCode = StatusCodes.CONFLICT;
    const duplicatedField = Object.keys((error as any).keyValue)[0];
    message = `${duplicatedField} already exists`;
    errorMessages = [
      { path: duplicatedField, message: `${duplicatedField} must be unique` },
    ];
  } else if (error.name === 'TokenExpiredError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = 'Session Expired';
    errorMessages = [
      {
        path: '',
        message: 'Your session has expired. Please log in again to continue.',
      },
    ];
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorMessages = error.message ? [{ path: '', message: error.message }] : [];
  } else if (error instanceof Error) {
    message = error.message;
    errorMessages = error.message ? [{ path: '', message: error.message }] : [];
  }

  res.locals.responsePayload = {
    success: false,
    statusCode,
    message,
    errorMessages,
  };

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.node_env !== 'production' ? error?.stack : undefined,
  });
};

export default globalErrorHandler;
