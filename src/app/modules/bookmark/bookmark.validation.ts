import { z } from 'zod';

// Validate postId in request body (must be a valid MongoDB ObjectId)
const toggle = z.object({
  body: z.object({
    postId: z
      .string({
        required_error: 'Post ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Post ID format'),
  }),
});

// Validate query for listing bookmarks (optional pagination/sorting/filtering/searching)
const getUserBookmarksQuery = z.object({
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform(Number)
      .optional(),
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .transform(Number)
      .optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    category: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format')
      .optional(),
    searchTerm: z.string().optional(),
  }),
});

export const BookmarkValidation = {
  toggle,
  getUserBookmarksQuery,
};
