"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    chatId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'Chat',
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    text: {
        type: String,
        required: false,
    },
    type: {
        type: String,
        enum: ['text', 'image', 'media', 'doc', 'mixed'],
        default: 'text',
    },
    images: { type: [String], default: [] },
    media: { type: [String], default: [] },
    docs: { type: [String], default: [] },
}, {
    timestamps: true,
});
exports.Message = (0, mongoose_1.model)('Message', messageSchema);
