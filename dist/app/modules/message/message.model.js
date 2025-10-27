"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
// Attachment Schema
const AttachmentSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['image', 'audio', 'video', 'file'],
        required: true,
    },
    url: { type: String, required: true },
    name: { type: String },
    size: { type: Number },
    mime: { type: String },
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number }, // For audio/video
}, { _id: false });
// Message Schema
const messageSchema = new mongoose_1.Schema({
    chatId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'Chat',
        index: true,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    text: {
        type: String,
        required: false,
        maxlength: 1000,
        trim: true,
    },
    type: {
        type: String,
        enum: ['text', 'image', 'media', 'doc', 'mixed'],
        default: 'text',
    },
    // Unified attachment system
    attachments: {
        type: [AttachmentSchema],
        default: [],
    },
    // Delivery & read tracking
    deliveredTo: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: [] }],
    readBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: [] }],
    // Message status
    status: {
        type: String,
        enum: ['sent', 'delivered', 'seen'],
        default: 'sent',
    },
    // Edit tracking
    editedAt: { type: Date },
}, {
    timestamps: true,
});
// Indexes
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
exports.Message = (0, mongoose_1.model)('Message', messageSchema);
