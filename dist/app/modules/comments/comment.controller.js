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
exports.CommentController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const comment_service_1 = require("./comment.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const getFilePath_1 = require("../../../shared/getFilePath");
// Create new comment or reply
const createComment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user.id;
    const image = (0, getFilePath_1.getSingleFilePath)(req.files, 'image');
    const payload = Object.assign(Object.assign({}, req.body), { userId, image });
    const result = yield comment_service_1.CommentService.createComment(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: payload.parentId
            ? 'Reply added successfully'
            : 'Comment added successfully',
        data: result,
    });
}));
// Get comments + replies
const getCommentsByPost = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    const result = yield comment_service_1.CommentService.getCommentsByPost(postId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Comments retrieved successfully',
        data: result,
    });
}));
// Update
const updateComment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user.id;
    const { id } = req.params;
    const image = (0, getFilePath_1.getSingleFilePath)(req.files, 'image');
    const payload = Object.assign(Object.assign({}, req.body), { image });
    const result = yield comment_service_1.CommentService.updateComment(id, userId, payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Comment updated successfully',
        data: result,
    });
}));
// Delete
const deleteComment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user.id;
    const { id } = req.params;
    const result = yield comment_service_1.CommentService.deleteComment(id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Comment deleted successfully',
        data: result,
    });
}));
exports.CommentController = {
    createComment,
    getCommentsByPost,
    updateComment,
    deleteComment,
};
