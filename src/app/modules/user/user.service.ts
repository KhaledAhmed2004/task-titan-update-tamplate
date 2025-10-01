import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES, USER_STATUS } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { AchievementType, IUser } from './user.interface';
import { User } from './user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { TaskModel } from '../task/task.model';
import { BidModel } from '../bid/bid.model';
import AggregationBuilder from '../../builder/AggregationBuilder';

const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  const createUser = await User.create(payload);
  if (!createUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
  }

  //send email
  const otp = generateOTP();
  const values = {
    name: createUser.name,
    otp: otp,
    email: createUser.email!,
  };
  console.log('Sending email to:', createUser.email, 'with OTP:', otp);

  const createAccountTemplate = emailTemplate.createAccount(values);
  emailHelper.sendEmail(createAccountTemplate);

  //save to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findOneAndUpdate(
    { _id: createUser._id },
    { $set: { authentication } }
  );

  return createUser;
};

const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //unlink file here
  if (payload.image) {
    unlinkFile(isExistUser.image);
  }

  const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateDoc;
};

const getAllUsers = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(User.find(), query)
    .search(['name', 'email'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const users = await userQuery.modelQuery;
  const paginationInfo = await userQuery.getPaginationInfo();

  return {
    pagination: paginationInfo,
    data: users,
  };
};

// const getUserStats = async () => {
//   // ✅ Total counts
//   const totalUsers = await User.countDocuments();
//   const totalTaskers = await User.countDocuments({ role: USER_ROLES.TASKER });
//   const totalPosters = await User.countDocuments({ role: USER_ROLES.POSTER });

//   // ✅ Function to calculate monthly growth for a given filter
//   const calculateMonthlyGrowth = async (
//     filter: Record<string, unknown> = {}
//   ) => {
//     const now = new Date();
//     const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//     const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

//     const thisMonthCount = await User.countDocuments({
//       ...filter,
//       createdAt: { $gte: startOfThisMonth },
//     });

//     const lastMonthCount = await User.countDocuments({
//       ...filter,
//       createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
//     });

//     let monthlyGrowth = 0;
//     let growthType: 'increase' | 'decrease' | 'no_change' = 'no_change';

//     if (lastMonthCount > 0) {
//       monthlyGrowth =
//         ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
//       growthType =
//         monthlyGrowth > 0
//           ? 'increase'
//           : monthlyGrowth < 0
//           ? 'decrease'
//           : 'no_change';
//     } else if (thisMonthCount > 0 && lastMonthCount === 0) {
//       monthlyGrowth = 100;
//       growthType = 'increase';
//     }

//     // ✅ Format for display
//     const formattedGrowth =
//       (monthlyGrowth > 0 ? '+' : '') + monthlyGrowth.toFixed(2) + '%';
//     return {
//       thisMonthCount,
//       lastMonthCount,
//       monthlyGrowth: Math.abs(monthlyGrowth), // absolute number for stats
//       formattedGrowth, // formatted string with + / - for UI
//       growthType,
//     };
//   };

//   // ✅ Calculate stats for all users, taskers, and posters
//   const allUserStats = await calculateMonthlyGrowth();
//   const taskerStats = await calculateMonthlyGrowth({ role: USER_ROLES.TASKER });
//   const posterStats = await calculateMonthlyGrowth({ role: USER_ROLES.POSTER });

//   return {
//     allUsers: { total: totalUsers, ...allUserStats },
//     taskers: { total: totalTaskers, ...taskerStats },
//     posters: { total: totalPosters, ...posterStats },
//   };
// };

const getUserStats = async () => {
  const builder = new AggregationBuilder(User);

  // All Users
  const allUsers = await builder.calculateGrowth({ period: 'month' });

  // Taskers
  const taskers = await builder.calculateGrowth({
    filter: { role: USER_ROLES.TASKER },
    period: 'month',
  });

  // Posters
  const posters = await builder.calculateGrowth({
    filter: { role: USER_ROLES.POSTER },
    period: 'month',
  });

  return {
    allUsers,
    taskers,
    posters,
  };
};

const resendVerifyEmailToDB = async (email: string) => {
  const isExistUser = await User.findOne({ email });
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (isExistUser.verified) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User is already verified!');
  }

  // Generate new OTP
  const otp = generateOTP();

  // Save OTP to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000), // 3 minutes
  };
  await User.findOneAndUpdate({ email }, { $set: { authentication } });

  // Send email
  const emailData = emailTemplate.createAccount({
    name: isExistUser.name,
    email: isExistUser.email,
    otp,
  });
  await emailHelper.sendEmail(emailData);

  return { otp }; // optional: just for logging/debugging
};

const updateUserStatus = async (id: string, status: USER_STATUS) => {
  const user = await User.isExistUserById(id);
  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  return updatedUser;
};

const getUserById = async (id: string) => {
  // 1️⃣ Find the user
  const user = await User.findById(id).select('-password -authentication');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  // 2️⃣ If user is a POSTER → return all tasks posted by this user
  if (user.role === USER_ROLES.POSTER) {
    const tasks = await TaskModel.find({ userId: id }).sort({ createdAt: -1 });

    return {
      user,
      tasks,
    };
  }

  // 3️⃣ If user is a TASKER → return all bids by this tasker
  if (user.role === USER_ROLES.TASKER) {
    // Get all bids by this tasker + populate task info
    const bids = await BidModel.find({ taskerId: id })
      .populate('taskId', 'title description budget status') // only select some fields from task
      .sort({ createdAt: -1 });

    // const bidsCount = bids.length;

    return {
      user,
      // bidsCount,
      bids,
    };
  }

  // 4️⃣ Other roles → just return user info
  return { user };
};

const getUserDistribution = async () => {
  const totalUsers = await User.countDocuments();
  const totalTaskers = await User.countDocuments({ role: USER_ROLES.TASKER });
  const totalPosters = await User.countDocuments({ role: USER_ROLES.POSTER });

  if (totalUsers === 0) {
    return {
      totalUsers: 0,
      taskers: { count: 0, percentage: '0%' },
      posters: { count: 0, percentage: '0%' },
    };
  }

  const taskerPercentage = ((totalTaskers / totalUsers) * 100).toFixed(2) + '%';
  const posterPercentage = ((totalPosters / totalUsers) * 100).toFixed(2) + '%';

  return {
    totalUsers,
    taskers: {
      count: totalTaskers,
      percentage: taskerPercentage,
    },
    posters: {
      count: totalPosters,
      percentage: posterPercentage,
    },
  };
};

// const getUserDetailsById = async (id: string) => {
//   // 1️⃣ Find the user
//   const user = await User.findById(id).select('-password -authentication');
//   if (!user) {
//     throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
//   }

//   return user;
// };

const getUserDetailsById = async (id: string) => {
  // 1️⃣ Find the user
  const user = await User.findById(id).select('-password -authentication');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  // 2️⃣ Update Top Rated Achievements dynamically
  const achievements: AchievementType[] = user.achievements || [];

  if (
    user.role === USER_ROLES.POSTER &&
    user.averageRating >= 4.5 &&
    user.ratingsCount >= 10
  ) {
    if (!achievements.includes('Top Rated Poster'))
      achievements.push('Top Rated Poster');
  } else {
    const index = achievements.indexOf('Top Rated Poster');
    if (index > -1) achievements.splice(index, 1);
  }

  if (
    user.role === 'TASKER' &&
    user.averageRating >= 4.5 &&
    user.ratingsCount >= 10
  ) {
    if (!achievements.includes('Top Rated Tittens'))
      achievements.push('Top Rated Tittens');
  } else {
    const index = achievements.indexOf('Top Rated Tittens');
    if (index > -1) achievements.splice(index, 1);
  }

  // 3️⃣ Save updated achievements (optional if you want to persist)
  user.achievements = achievements;
  await user.save();

  return user;
};

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  getAllUsers,
  resendVerifyEmailToDB,
  updateUserStatus,
  getUserById,
  getUserStats,
  getUserDistribution,
  getUserDetailsById,
};
