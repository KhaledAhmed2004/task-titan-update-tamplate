import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';
import { JwtPayload } from 'jsonwebtoken';

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { ...verifyData } = req.body;
  const result = await AuthService.verifyEmailToDB(verifyData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result.data,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { ...loginData } = req.body;
  const result = await AuthService.loginUserFromDB(loginData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User logged in successfully.',
    data: result.createToken,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const { deviceToken } = req.body;
  console.log('deviceToken', deviceToken);
  const user = req.user as JwtPayload;

  await AuthService.logoutUserFromDB(user, deviceToken);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User logged out successfully.',
  });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const email = req.body.email;
  const result = await AuthService.forgetPasswordToDB(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message:
      'Please check your email. We have sent you a one-time passcode (OTP).',
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { ...resetData } = req.body;
  const result = await AuthService.resetPasswordToDB(token!, resetData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your password has been successfully reset.',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { ...passwordData } = req.body;
  await AuthService.changePasswordToDB(user, passwordData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your password has been successfully changed',
  });
});

const resendVerifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.resendVerifyEmailToDB(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Verification code has been resent to your email.',
    data: result,
  });
});

const googleCallback = catchAsync(async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    if (!user) {
      console.error('❌ No user data received from passport');
      return res.redirect(
        `https://directory-supplements-adapter-designs.trycloudflare.com/error?message=Google authentication failed. No user data received.`
      );
    }

    const result = await AuthService.googleLoginToDB(user);

    // Redirect to frontend with token as query parameter in fronted url
    return res.redirect(
      `https://directory-supplements-adapter-designs.trycloudflare.com/success?token=${result.createToken}`
    );
  } catch (error) {
    console.error('💥 Google OAuth callback error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return res.redirect(
      `https://directory-supplements-adapter-designs.trycloudflare.com/error?message=${encodeURIComponent(
        errorMessage
      )}`
    );
  }
});

export const AuthController = {
  verifyEmail,
  logoutUser,
  loginUser,
  forgetPassword,
  resetPassword,
  changePassword,
  resendVerifyEmail,
  googleCallback,
};
