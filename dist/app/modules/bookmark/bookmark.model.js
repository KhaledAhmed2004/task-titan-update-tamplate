"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bookmark = void 0;
const mongoose_1 = require("mongoose");
const bookmarkSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    post: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
// Prevent duplicate bookmarks (same user cannot bookmark same job twice)
bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });
exports.Bookmark = (0, mongoose_1.model)('Bookmark', bookmarkSchema);
