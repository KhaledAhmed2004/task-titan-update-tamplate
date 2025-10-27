import mongoose from 'mongoose';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { StripeAccount as StripeAccountModel } from './payment.model';
import { IStripeAccount } from './payment.interface';
import { stripe, handleStripeError } from '../../../config/stripe';
import {
  createExpressAccount as stripeCreateExpressAccount,
  createOnboardingLink as stripeCreateOnboardingLink,
  retrieveAccount as stripeRetrieveAccount,
} from './stripe.adapter';

// Create Stripe Connect account for freelancers
const createStripeAccount = async (
  data: IStripeAccount
): Promise<any> => {
  try {
    const user = await User.findById(data.userId).select(
      'name email phone dateOfBirth location'
    );

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const existingAccount = await StripeAccountModel.isExistAccountByUserId(
      data.userId
    );
    if (existingAccount) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'User already has a Stripe account'
      );
    }

    let dob: { year: number; month: number; day: number } | undefined;
    if (user.dateOfBirth) {
      const parts = user.dateOfBirth.split('-');
      dob = {
        year: Number(parts[0]),
        month: Number(parts[1]),
        day: Number(parts[2]),
      };
    }

    const account = await stripeCreateExpressAccount({
      email: user.email,
      firstName: user.name.split(' ')[0],
      lastName: user.name.split(' ')[1] || '',
      dob,
      city: user.location || undefined,
      metadata: {
        user_id: data.userId.toString(),
        account_type: data.accountType,
      },
    });

    const stripeAccount = new StripeAccountModel({
      userId: data.userId,
      stripeAccountId: account.id,
      onboardingCompleted: false,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      country: account.country,
      currency: account.default_currency || 'usd',
      businessType: account.business_type || 'individual',
    });
    await stripeAccount.save();

    return {
      account_id: account.id,
      onboarding_required: !account.charges_enabled,
      database_record: stripeAccount,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to create Stripe account: ${handleStripeError(error)}`
    );
  }
};

// Create onboarding link for freelancer
const createOnboardingLink = async (userId: string): Promise<string> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const stripeAccount = await StripeAccountModel.isExistAccountByUserId(
      userObjectId
    );

    if (!stripeAccount) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Stripe account not found. Please create an account first.'
      );
    }

    if (stripeAccount.onboardingCompleted) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'User has already completed onboarding'
      );
    }

    const url = await stripeCreateOnboardingLink(
      stripeAccount.stripeAccountId,
      `${process.env.FRONTEND_URL}/onboarding/refresh`,
      `${process.env.FRONTEND_URL}/onboarding/complete`
    );

    return url;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to create onboarding link: ${handleStripeError(error)}`
    );
  }
};

// Check if freelancer has completed Stripe onboarding
const checkOnboardingStatus = async (
  userId: string
): Promise<{
  completed: boolean;
  account_id?: string;
  missing_fields?: string[];
}> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const stripeAccount = await StripeAccountModel.isExistAccountByUserId(
      userObjectId
    );

    if (!stripeAccount) {
      return { completed: false };
    }

    const account = await stripeRetrieveAccount(stripeAccount.stripeAccountId);

    const completed = account.charges_enabled && account.payouts_enabled;
    const currentlyDue = account?.requirements?.currently_due;

    if (completed !== stripeAccount.onboardingCompleted) {
      await StripeAccountModel.updateAccountStatus(stripeAccount.userId, {
        onboardingCompleted: completed,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      });
    }

    return {
      completed,
      account_id: stripeAccount.stripeAccountId,
      missing_fields: currentlyDue ?? undefined,
    };
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to check onboarding status: ${handleStripeError(error)}`
    );
  }
};

// Ensure freelancer is onboarded before allowing escrow actions
const ensureFreelancerOnboarded = async (taskerId: any) => {
  const freelancerStripeAccount =
    await StripeAccountModel.isExistAccountByUserId(taskerId);
  if (!freelancerStripeAccount || !freelancerStripeAccount.onboardingCompleted) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Freelancer has not completed Stripe onboarding'
    );
  }
  return freelancerStripeAccount;
};

// Get freelancer account or throw
const getFreelancerAccountOrThrow = async (userId: any) => {
  const freelancerStripeAccount =
    await StripeAccountModel.isExistAccountByUserId(userId);
  if (!freelancerStripeAccount?.stripeAccountId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Freelancer Stripe account not found'
    );
  }
  return freelancerStripeAccount;
};

// Delete a Stripe Connect account
const deleteStripeAccountService = async (accountId: string) => {
  try {
    const deleted = await stripe.accounts.del(accountId);

    if (!deleted.deleted) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to delete account');
    }

    return deleted;
  } catch (error: any) {
    throw handleStripeError(error);
  }
};

// Update local account status from Stripe account.update webhook
const handleAccountUpdated = async (account: any): Promise<void> => {
  const completed = account.charges_enabled && account.payouts_enabled;

  await StripeAccountModel.updateMany(
    {
      stripeAccountId: account.id,
    },
    {
      onboardingCompleted: completed,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    }
  );
};

const StripeConnectService = {
  createStripeAccount,
  createOnboardingLink,
  checkOnboardingStatus,
  ensureFreelancerOnboarded,
  getFreelancerAccountOrThrow,
  deleteStripeAccountService,
  handleAccountUpdated,
};

export default StripeConnectService;