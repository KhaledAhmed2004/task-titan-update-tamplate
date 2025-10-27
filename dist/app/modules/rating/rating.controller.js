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
exports.RatingController = void 0;
const rating_service_1 = require("./rating.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const createRating = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req === null || req === void 0 ? void 0 : req.user;
    const userId = user === null || user === void 0 ? void 0 : user.id;
    const data = {
        taskId: req.body.taskId,
        givenBy: userId,
        givenTo: req.body.givenTo,
        rating: req.body.rating,
        message: req.body.message,
    };
    const result = yield rating_service_1.RatingService.createRating(data);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 201,
        message: 'Rating created successfully',
        data: result,
    });
}));
const getAllRatings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rating_service_1.RatingService.getAllRatings(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        data: result,
    });
}));
const getMyRatings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req === null || req === void 0 ? void 0 : req.user;
    const userId = user === null || user === void 0 ? void 0 : user.id;
    const result = yield rating_service_1.RatingService.getMyRatings(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        data: result,
    });
}));
const getMyRatingStats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req === null || req === void 0 ? void 0 : req.user;
    const userId = user === null || user === void 0 ? void 0 : user.id;
    const result = yield rating_service_1.RatingService.getMyRatingStats(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        data: result,
    });
}));
const getSingleRating = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rating_service_1.RatingService.getSingleRating(req.params.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        data: result,
    });
}));
const updateRating = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rating_service_1.RatingService.updateRating(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: 'Rating updated successfully',
        data: result,
    });
}));
const deleteRating = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user === null || user === void 0 ? void 0 : user.id;
    const result = yield rating_service_1.RatingService.deleteRating(req.params.id, userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: 'Rating deleted successfully',
        data: result,
    });
}));
const getUserRatings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rating_service_1.RatingService.getUserRatings(req.params.userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        data: result,
    });
}));
const getUserRatingStats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rating_service_1.RatingService.getUserRatingStats(req.params.userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        data: result,
    });
}));
const getTaskRatings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rating_service_1.RatingService.getTaskRatings(req.params.taskId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        data: result,
    });
}));
exports.RatingController = {
    createRating,
    getAllRatings,
    getSingleRating,
    updateRating,
    deleteRating,
    getUserRatings,
    getTaskRatings,
    getUserRatingStats,
    getMyRatings,
    getMyRatingStats,
};
