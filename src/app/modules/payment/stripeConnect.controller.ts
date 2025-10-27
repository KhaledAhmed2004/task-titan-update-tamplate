import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiError';

import { handleWebhookEvent } from './payment.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from '../../../shared/catchAsync';
import StripeConnectService from './stripeConnect.service';

const createStripeAccountController = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user.id;
    const { accountType } = req.body;

    if (!userId || !accountType) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'User ID and account type are required'
      );
    }

    const result = await StripeConnectService.createStripeAccount({ userId, accountType });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'Stripe account created successfully',
      data: result,
    });
  }
);

const getOnboardingLinkController = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user.id;

    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
    }

    const onboardingUrl = await StripeConnectService.createOnboardingLink(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Onboarding link created successfully',
      data: {
        onboarding_url: onboardingUrl,
      },
    });
  }
);

// Check onboarding status
const checkOnboardingStatusController = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user.id;

    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
    }

    const status = await StripeConnectService.checkOnboardingStatus(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Onboarding status retrieved successfully',
      data: status,
    });
  }
);

// Handle Stripe webhook
const handleStripeWebhookController = catchAsync(
  async (req: Request, res: Response) => {
    const event = req.body;

    if (!event || !event.type) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid webhook event');
    }

    await handleWebhookEvent(event);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Webhook processed successfully',
    });
  }
);

export const StripeConnectController = {
  createStripeAccountController,
  getOnboardingLinkController,
  checkOnboardingStatusController,
  handleStripeWebhookController,
};
