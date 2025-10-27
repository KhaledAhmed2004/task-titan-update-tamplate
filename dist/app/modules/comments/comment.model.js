"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    postId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true, trim: true },
    parentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Comment', default: null }, // reply support
    image: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
exports.Comment = (0, mongoose_1.model)('Comment', commentSchema);
