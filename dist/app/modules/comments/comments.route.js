"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const comment_controller_1 = require("./comment.controller");
const fileUploadHandler_1 = __importDefault(require("../../middlewares/fileUploadHandler"));
const router = (0, express_1.Router)();
// Create comment or reply
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.TASKER, user_1.USER_ROLES.POSTER), (0, fileUploadHandler_1.default)(), (req, res, next) => {
    if (req.body.data) {
        req.body = JSON.parse(req.body.data);
    }
    return comment_controller_1.CommentController.createComment(req, res, next);
});
// Get comments with replies
router.get('/:postId', comment_controller_1.CommentController.getCommentsByPost);
// Update comment
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.TASKER, user_1.USER_ROLES.POSTER), (0, fileUploadHandler_1.default)(), (req, res, next) => {
    if (req.body.data) {
        req.body = JSON.parse(req.body.data);
    }
    return comment_controller_1.CommentController.updateComment(req, res, next);
});
// Delete comment
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.TASKER, user_1.USER_ROLES.POSTER), comment_controller_1.CommentController.deleteComment);
exports.CommentRoutes = router;
