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
exports.BidController = void 0;
const http_status_codes_1 = require("http-status-codes");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const bid_service_1 = require("./bid.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const createBid = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const user = req === null || req === void 0 ? void 0 : req.user;
    const taskerId = user.id;
    const bidData = req.body;
    bidData.taskId = taskId;
    bidData.taskerId = taskerId;
    const result = yield bid_service_1.BidService.createBid(bidData, taskerId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Bid created successfully',
        data: result,
    });
}));
const getAllTasksByTaskerBids = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req === null || req === void 0 ? void 0 : req.user;
    const taskerId = user.id;
    const result = yield bid_service_1.BidService.getAllTasksByTaskerBids(taskerId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Tasks with your bids retrieved successfully',
        data: result.data,
        pagination: result.pagination,
    });
}));
const updateBid = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bidId } = req.params;
    const user = req === null || req === void 0 ? void 0 : req.user;
    const taskerId = user.id;
    const bidUpdate = req.body;
    const result = yield bid_service_1.BidService.updateBid(bidId, taskerId, bidUpdate);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Bid updated successfully',
        data: result,
    });
}));
const deleteBid = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bidId } = req.params;
    const user = req === null || req === void 0 ? void 0 : req.user;
    const taskerId = user.id;
    const result = yield bid_service_1.BidService.deleteBid(bidId, taskerId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Bid deleted successfully',
        data: result,
    });
}));
const getAllBidsByTaskId = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const result = yield bid_service_1.BidService.getAllBidsByTaskId(taskId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.data.length
            ? 'Bids for task retrieved successfully'
            : 'No bids found for this task',
        data: result.data,
        pagination: result.pagination,
    });
}));
const getBidById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bidId } = req.params;
    const result = yield bid_service_1.BidService.getBidById(bidId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Bid retrieved successfully',
        data: result,
    });
}));
const acceptBid = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bidId } = req.params;
    const user = req === null || req === void 0 ? void 0 : req.user;
    const clientId = user.id;
    const result = yield bid_service_1.BidService.acceptBid(bidId, clientId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Bid accepted successfully',
        data: result,
    });
}));
exports.BidController = {
    createBid,
    getAllBidsByTaskId,
    getBidById,
    updateBid,
    deleteBid,
    acceptBid,
    getAllTasksByTaskerBids,
};
