"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.RatingService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const rating_model_1 = require("./rating.model");
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const task_model_1 = require("../task/task.model");
const user_model_1 = require("../user/user.model");
const serviceHelpers_1 = require("../../../helpers/serviceHelpers");
const createRating = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // 1️⃣ Prevent self-rating
        if (((_a = payload.givenBy) === null || _a === void 0 ? void 0 : _a.toString()) === ((_b = payload.givenTo) === null || _b === void 0 ? void 0 : _b.toString())) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You cannot rate yourself');
        }
        // 2️⃣ Prevent duplicate rating for the same task by the same user
        const existingRating = yield rating_model_1.Rating.findOne({
            taskId: payload.taskId,
            givenBy: payload.givenBy,
        }).session(session);
        if (existingRating) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You have already rated this task');
        }
        // 3️⃣ Check if task exists
        const task = yield task_model_1.TaskModel.findById(payload.taskId).session(session);
        if (!task) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Task not found');
        }
        // 4️⃣ Only completed tasks can be rated
        if (task.status !== 'completed') {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You can only rate after task completion');
        }
        // 5️⃣ Ensure both users are participants
        const posterId = task.userId.toString();
        const assignedId = ((_c = task.assignedTo) === null || _c === void 0 ? void 0 : _c.toString()) || '';
        const participants = [posterId, assignedId];
        if (!participants.includes(((_d = payload.givenBy) === null || _d === void 0 ? void 0 : _d.toString()) || '')) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not a participant of this task');
        }
        if (!participants.includes(((_e = payload.givenTo) === null || _e === void 0 ? void 0 : _e.toString()) || '')) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Rated user is not a participant of this task');
        }
        // 6️⃣ Create rating
        const rating = yield rating_model_1.Rating.create([payload], { session });
        // 6️⃣ Push rating ref into Task
        yield task_model_1.TaskModel.findByIdAndUpdate(payload.taskId, { $push: { ratings: rating[0]._id } }, { session });
        // 7️⃣ Update rated user's averageRating & ratingsCount incrementally
        if (payload.givenTo && payload.rating !== undefined) {
            const user = yield user_model_1.User.findById(payload.givenTo).session(session);
            if (user) {
                const newRatingsCount = user.ratingsCount + 1;
                const newAverageRating = (user.averageRating * user.ratingsCount + payload.rating) /
                    newRatingsCount;
                yield user_model_1.User.findByIdAndUpdate(payload.givenTo, {
                    ratingsCount: newRatingsCount,
                    averageRating: newAverageRating,
                }, { session });
            }
        }
        // ✅ Commit transaction
        yield session.commitTransaction();
        session.endSession();
        return rating[0]; // Because create with array returns an array
    }
    catch (err) {
        // ❌ Abort transaction on error
        yield session.abortTransaction();
        session.endSession();
        throw err;
    }
});
const getAllRatings = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const qb = new QueryBuilder_1.default(rating_model_1.Rating.find(), query)
        .search(['message'])
        .filter()
        .sort()
        .paginate()
        .fields()
        .populate(['givenBy', 'givenTo', 'taskId'], {
        givenBy: 'name email',
        givenTo: 'name email',
        taskId: 'title',
    });
    const data = yield qb.modelQuery.exec();
    const meta = yield qb.getPaginationInfo();
    return { meta, data };
});
const getMyRatings = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const qb = new QueryBuilder_1.default(rating_model_1.Rating.find({ givenBy: userId }), {})
        .sort()
        .populate(['givenTo', 'taskId'], {
        givenTo: 'name email',
        taskId: 'title',
    });
    return yield qb.modelQuery.exec();
});
const getMyRatingStats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield rating_model_1.Rating.aggregate([
        { $match: { givenBy: userId } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 },
            },
        },
    ]);
    return stats[0] || { averageRating: 0, totalRatings: 0 };
});
const getSingleRating = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const rating = yield rating_model_1.Rating.findById(id)
        .populate('givenBy', 'name email')
        .populate('givenTo', 'name email')
        .populate('taskId', 'title');
    if (!rating)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Rating not found');
    return rating;
});
// const updateRating = async (id: string, payload: Partial<IRating>) => {
//   const rating = await Rating.findByIdAndUpdate(id, payload, { new: true });
//   if (!rating) throw new ApiError(StatusCodes.NOT_FOUND, 'Rating not found');
//   return rating;
// };
const updateRating = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, serviceHelpers_1.updateByIdOrThrow)(rating_model_1.Rating, id, payload, 'Rating');
});
const deleteRating = (ratingId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Find the rating by ID
    const rating = yield rating_model_1.Rating.findById(ratingId);
    if (!rating) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Rating not found');
    }
    // 2️⃣ Ownership check: Only the creator can delete
    if (rating.givenBy.toString() !== userId) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You can only delete your own rating');
    }
    // 3️⃣ Delete using deleteOne()
    yield rating_model_1.Rating.deleteOne({ _id: ratingId });
    return rating;
});
const getUserRatings = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const qb = new QueryBuilder_1.default(rating_model_1.Rating.find({ givenTo: userId }), {})
        .sort()
        .populate(['givenBy', 'taskId'], {
        givenBy: 'name email',
        taskId: 'title',
    });
    return yield qb.modelQuery.exec();
});
const getUserRatingStats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield rating_model_1.Rating.aggregate([
        { $match: { givenTo: new mongoose_1.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 },
            },
        },
    ]);
    return stats[0] || { averageRating: 0, totalRatings: 0 };
});
const getTaskRatings = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    const qb = new QueryBuilder_1.default(rating_model_1.Rating.find({ taskId }), {})
        .sort()
        .populate(['givenBy', 'givenTo'], {
        givenBy: 'name email',
        givenTo: 'name email',
    });
    return yield qb.modelQuery.exec();
});
exports.RatingService = {
    createRating,
    getAllRatings,
    getMyRatings,
    getMyRatingStats,
    getSingleRating,
    updateRating,
    deleteRating,
    getUserRatings,
    getUserRatingStats,
    getTaskRatings,
};
