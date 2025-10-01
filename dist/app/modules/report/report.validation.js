"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportValidation = exports.createReportSchema = void 0;
const zod_1 = require("zod");
// ---------------------- CREATE REPORT ----------------------
exports.createReportSchema = zod_1.z.object({
    title: zod_1.z
        .string({ required_error: 'Title is required' })
        .min(3, 'Title must be at least 3 characters long')
        .max(100, 'Title cannot exceed 100 characters'),
    description: zod_1.z
        .string({ required_error: 'Description is required' })
        .min(10, 'Description must be at least 10 characters long'),
    type: zod_1.z.string({
        required_error: 'Report type is required',
    }),
    images: zod_1.z.array(zod_1.z.string()).optional(), // optional images
    relatedTo: zod_1.z.string().optional(), // optional related ID
});
exports.ReportValidation = {
    createReportSchema: exports.createReportSchema,
};
