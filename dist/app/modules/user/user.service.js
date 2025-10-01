"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const http_status_codes_1 = require("http-status-codes");
const user_1 = require("../../../enums/user");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const emailHelper_1 = require("../../../helpers/emailHelper");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const unlinkFile_1 = __importDefault(require("../../../shared/unlinkFile"));
const generateOTP_1 = __importDefault(require("../../../util/generateOTP"));
const user_model_1 = require("./user.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const task_model_1 = require("../task/task.model");
const bid_model_1 = require("../bid/bid.model");
const AggregationBuilder_1 = __importDefault(require("../../builder/AggregationBuilder"));
const createUserToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const createUser = yield user_model_1.User.create(payload);
    if (!createUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user');
    }
    //send email
    const otp = (0, generateOTP_1.default)();
    const values = {
        name: createUser.name,
        otp: otp,
        email: createUser.email,
    };
    console.log('Sending email to:', createUser.email, 'with OTP:', otp);
    const createAccountTemplate = emailTemplate_1.emailTemplate.createAccount(values);
    emailHelper_1.emailHelper.sendEmail(createAccountTemplate);
    //save to DB
    const authentication = {
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 3 * 60000),
    };
    yield user_model_1.User.findOneAndUpdate({ _id: createUser._id }, { $set: { authentication } });
    return createUser;
});
const getUserProfileFromDB = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    return isExistUser;
});
const updateProfileToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //unlink file here
    if (payload.image) {
        (0, unlinkFile_1.default)(isExistUser.image);
    }
    const updateDoc = yield user_model_1.User.findOneAndUpdate({ _id: id }, payload, {
        new: true,
    });
    return updateDoc;
});
const getAllUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const userQuery = new QueryBuilder_1.default(user_model_1.User.find(), query)
        .search(['name', 'email'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const users = yield userQuery.modelQuery;
    const paginationInfo = yield userQuery.getPaginationInfo();
    return {
        pagination: paginationInfo,
        data: users,
    };
});
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
const getUserStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const builder = new AggregationBuilder_1.default(user_model_1.User);
    // All Users
    const allUsers = yield builder.calculateGrowth({ period: 'month' });
    // Taskers
    const taskers = yield builder.calculateGrowth({
        filter: { role: user_1.USER_ROLES.TASKER },
        period: 'month',
    });
    // Posters
    const posters = yield builder.calculateGrowth({
        filter: { role: user_1.USER_ROLES.POSTER },
        period: 'month',
    });
    return {
        allUsers,
        taskers,
        posters,
    };
});
const resendVerifyEmailToDB = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.findOne({ email });
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    if (isExistUser.verified) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User is already verified!');
    }
    // Generate new OTP
    const otp = (0, generateOTP_1.default)();
    // Save OTP to DB
    const authentication = {
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 3 * 60000), // 3 minutes
    };
    yield user_model_1.User.findOneAndUpdate({ email }, { $set: { authentication } });
    // Send email
    const emailData = emailTemplate_1.emailTemplate.createAccount({
        name: isExistUser.name,
        email: isExistUser.email,
        otp,
    });
    yield emailHelper_1.emailHelper.sendEmail(emailData);
    return { otp }; // optional: just for logging/debugging
});
const updateUserStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.isExistUserById(id);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    const updatedUser = yield user_model_1.User.findByIdAndUpdate(id, { status }, { new: true });
    return updatedUser;
});
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Find the user
    const user = yield user_model_1.User.findById(id).select('-password -authentication');
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User doesn't exist!");
    }
    // 2️⃣ If user is a POSTER → return all tasks posted by this user
    if (user.role === user_1.USER_ROLES.POSTER) {
        const tasks = yield task_model_1.TaskModel.find({ userId: id }).sort({ createdAt: -1 });
        return {
            user,
            tasks,
        };
    }
    // 3️⃣ If user is a TASKER → return all bids by this tasker
    if (user.role === user_1.USER_ROLES.TASKER) {
        // Get all bids by this tasker + populate task info
        const bids = yield bid_model_1.BidModel.find({ taskerId: id })
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
});
const getUserDistribution = () => __awaiter(void 0, void 0, void 0, function* () {
    const totalUsers = yield user_model_1.User.countDocuments();
    const totalTaskers = yield user_model_1.User.countDocuments({ role: user_1.USER_ROLES.TASKER });
    const totalPosters = yield user_model_1.User.countDocuments({ role: user_1.USER_ROLES.POSTER });
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
});
// const getUserDetailsById = async (id: string) => {
//   // 1️⃣ Find the user
//   const user = await User.findById(id).select('-password -authentication');
//   if (!user) {
//     throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
//   }
//   return user;
// };
const getUserDetailsById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Find the user
    const user = yield user_model_1.User.findById(id).select('-password -authentication');
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User doesn't exist!");
    }
    // 2️⃣ Update Top Rated Achievements dynamically
    const achievements = user.achievements || [];
    if (user.role === user_1.USER_ROLES.POSTER &&
        user.averageRating >= 4.5 &&
        user.ratingsCount >= 10) {
        if (!achievements.includes('Top Rated Poster'))
            achievements.push('Top Rated Poster');
    }
    else {
        const index = achievements.indexOf('Top Rated Poster');
        if (index > -1)
            achievements.splice(index, 1);
    }
    if (user.role === 'TASKER' &&
        user.averageRating >= 4.5 &&
        user.ratingsCount >= 10) {
        if (!achievements.includes('Top Rated Tittens'))
            achievements.push('Top Rated Tittens');
    }
    else {
        const index = achievements.indexOf('Top Rated Tittens');
        if (index > -1)
            achievements.splice(index, 1);
    }
    // 3️⃣ Save updated achievements (optional if you want to persist)
    user.achievements = achievements;
    yield user.save();
    return user;
});
exports.UserService = {
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
