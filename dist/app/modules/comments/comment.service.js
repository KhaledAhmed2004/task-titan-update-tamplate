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
exports.CommentService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const comment_model_1 = require("./comment.model");
const unlinkFile_1 = __importDefault(require("../../../shared/unlinkFile"));
const mongoose_1 = __importDefault(require("mongoose"));
// Create comment / reply
const createComment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // If reply -> check parentId exists
    if (payload.parentId) {
        const parentExists = yield comment_model_1.Comment.findOne({
            _id: payload.parentId,
            isDeleted: false,
        });
        if (!parentExists) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid parent comment');
        }
    }
    return yield comment_model_1.Comment.create(payload);
});
// Get comments for a post with replies
const getCommentsByPost = (postId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(postId)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Post ID');
    }
    // root comments only
    const comments = yield comment_model_1.Comment.find({
        postId,
        parentId: null,
        isDeleted: false,
    })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });
    // replies fetch
    const commentsWithReplies = yield Promise.all(comments.map((comment) => __awaiter(void 0, void 0, void 0, function* () {
        const replies = yield comment_model_1.Comment.find({
            parentId: comment._id,
            isDeleted: false,
        })
            .populate('userId', 'name email')
            .sort({ createdAt: 1 });
        return Object.assign(Object.assign({}, comment.toObject()), { replies });
    })));
    return commentsWithReplies;
});
// Update comment
const updateComment = (id, userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const comment = yield comment_model_1.Comment.findOne({ _id: id, userId, isDeleted: false });
    if (!comment) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Comment not found or unauthorized');
    }
    // new image replace
    if (payload.image && comment.image) {
        (0, unlinkFile_1.default)(comment.image);
    }
    comment.comment = (_a = payload.comment) !== null && _a !== void 0 ? _a : comment.comment;
    if (payload.image) {
        comment.image = payload.image;
    }
    yield comment.save();
    return comment;
});
// Soft delete comment
const deleteComment = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = yield comment_model_1.Comment.findOne({ _id: id, userId, isDeleted: false });
    if (!comment) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Comment not found or unauthorized');
    }
    if (comment.image) {
        (0, unlinkFile_1.default)(comment.image);
    }
    comment.isDeleted = true;
    yield comment.save();
    return comment;
});
exports.CommentService = {
    createComment,
    getCommentsByPost,
    updateComment,
    deleteComment,
};
