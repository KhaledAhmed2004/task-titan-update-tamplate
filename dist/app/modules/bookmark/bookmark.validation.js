"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkValidation = void 0;
const zod_1 = require("zod");
// Validate postId in request body (must be a valid MongoDB ObjectId)
const toggle = zod_1.z.object({
    body: zod_1.z.object({
        postId: zod_1.z
            .string({
            required_error: 'Post ID is required',
        })
            .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Post ID format'),
    }),
});
// Validate query for listing bookmarks (optional pagination/sorting/filtering/searching)
const getUserBookmarksQuery = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z
            .string()
            .regex(/^\d+$/, 'Limit must be a number')
            .transform(Number)
            .optional(),
        page: zod_1.z
            .string()
            .regex(/^\d+$/, 'Page must be a number')
            .transform(Number)
            .optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
        category: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format')
            .optional(),
        searchTerm: zod_1.z.string().optional(),
    }),
});
exports.BookmarkValidation = {
    toggle,
    getUserBookmarksQuery,
};
