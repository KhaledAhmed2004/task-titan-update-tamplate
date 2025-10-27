"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const createTaskZodSchema = zod_1.default.object({
    title: zod_1.default.string({ required_error: 'Title is required' }),
    taskCategory: zod_1.default.string({ required_error: 'Task category is required' }),
    description: zod_1.default.string({ required_error: 'Description is required' }),
    taskImage: zod_1.default.array(zod_1.default.string()).optional(),
    taskBudget: zod_1.default.number({ required_error: 'Task budget is required' }),
    taskLocation: zod_1.default.string({ required_error: 'Task location is required' }),
    latitude: zod_1.default.number({ required_error: 'Latitude is required' }),
    longitude: zod_1.default.number({ required_error: 'Longitude is required' }),
});
const updateTaskZodSchema = zod_1.default.object({
    title: zod_1.default.string().optional(),
    taskCategory: zod_1.default.string().optional(),
    description: zod_1.default.string().optional(),
    taskImage: zod_1.default.array(zod_1.default.string()).optional(),
    taskBudget: zod_1.default.number().optional(),
    taskLocation: zod_1.default.string().optional(),
    latitude: zod_1.default.number().optional(),
    longitude: zod_1.default.number().optional(),
    status: zod_1.default.string().optional(),
    dueDate: zod_1.default.string().optional(),
    priority: zod_1.default.string().optional(),
});
const cancelTaskZodSchema = zod_1.default.object({
    body: zod_1.default.object({
        reason: zod_1.default.string({ required_error: 'Cancellation reason is required' })
            .min(1, 'Cancellation reason cannot be empty')
            .max(500, 'Cancellation reason cannot exceed 500 characters'),
    }),
    params: zod_1.default.object({
        taskId: zod_1.default.string({ required_error: 'Task ID is required' })
            .regex(/^[0-9a-fA-F]{24}$/, 'Invalid task ID format'),
    }),
});
exports.TaskValidation = {
    createTaskZodSchema,
    updateTaskZodSchema,
    cancelTaskZodSchema,
};
