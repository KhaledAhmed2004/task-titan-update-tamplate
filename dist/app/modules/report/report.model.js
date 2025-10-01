"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = void 0;
const mongoose_1 = require("mongoose");
const report_interface_1 = require("./report.interface");
const reportSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Report title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Report description is required'],
    },
    type: {
        type: String,
        required: [true, 'Report type is required'],
    },
    status: {
        type: String,
        enum: Object.values(report_interface_1.REPORT_STATUS),
        default: report_interface_1.REPORT_STATUS.PENDING,
    },
    reportedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reporter is required'],
    },
    relatedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
    },
    images: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true,
});
// Create the model
exports.Report = (0, mongoose_1.model)('Report', reportSchema);
