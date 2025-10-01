"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingValidation = void 0;
const zod_1 = require("zod");
// Create Rating
const createRatingZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        taskId: zod_1.z
            .string({
            required_error: 'Task ID is required',
        })
            .min(1, 'Task ID cannot be empty'),
        givenTo: zod_1.z
            .string({
            required_error: 'Rated user ID is required',
        })
            .min(1, 'Rated user ID cannot be empty'),
        rating: zod_1.z
            .number({
            required_error: 'Rating is required',
        })
            .min(1, 'Rating must be at least 1')
            .max(5, 'Rating cannot exceed 5'),
        message: zod_1.z
            .string()
            .max(500, 'Message cannot exceed 500 characters')
            .optional(),
    }),
});
// Update Rating
const updateRatingZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        rating: zod_1.z
            .number()
            .min(1, 'Rating must be at least 1')
            .max(5, 'Rating cannot exceed 5')
            .optional(),
        message: zod_1.z
            .string()
            .max(500, 'Message cannot exceed 500 characters')
            .optional(),
    }),
});
// Query Ratings
const getRatingsQueryZodSchema = zod_1.z.object({
    query: zod_1.z.object({
        taskId: zod_1.z.string().optional(),
        givenBy: zod_1.z.string().optional(),
        givenTo: zod_1.z.string().optional(),
        page: zod_1.z
            .string()
            .transform(val => parseInt(val, 10))
            .refine(val => val > 0, { message: 'Page must be a positive number' })
            .optional(),
        limit: zod_1.z
            .string()
            .transform(val => parseInt(val, 10))
            .refine(val => val > 0 && val <= 100, {
            message: 'Limit must be between 1 and 100',
        })
            .optional(),
        sortBy: zod_1.z.enum(['createdAt', 'rating', 'updatedAt']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
// Params
const ratingIdParamZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z
            .string({
            required_error: 'Rating ID is required',
        })
            .min(1, 'Rating ID cannot be empty'),
    }),
});
const userIdParamZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z
            .string({
            required_error: 'User ID is required',
        })
            .min(1, 'User ID cannot be empty'),
    }),
});
const taskIdParamZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        taskId: zod_1.z
            .string({
            required_error: 'Task ID is required',
        })
            .min(1, 'Task ID cannot be empty'),
    }),
});
exports.RatingValidation = {
    createRatingZodSchema,
    updateRatingZodSchema,
    getRatingsQueryZodSchema,
    ratingIdParamZodSchema,
    userIdParamZodSchema,
    taskIdParamZodSchema,
};
