"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationHelpers = exports.compositeSchemas = exports.querySchemas = exports.bodySchemas = exports.paramSchemas = exports.paginationQuerySchema = exports.commonValidators = void 0;
const zod_1 = require("zod");
/**
 * Common validation schemas for reuse across modules
 * This file contains frequently used validation patterns to reduce duplication
 */
// ====== COMMON FIELD VALIDATORS ======
exports.commonValidators = {
    // MongoDB ObjectId validation
    mongoId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
    // Email validation
    email: zod_1.z.string().email('Invalid email format'),
    // Password validation
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long'),
    // Phone number validation (basic)
    phone: zod_1.z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
    // URL validation
    url: zod_1.z.string().url('Invalid URL format'),
    // Date string validation
    dateString: zod_1.z.string().datetime('Invalid date format'),
    // Positive number validation
    positiveNumber: zod_1.z.number().positive('Must be a positive number'),
    // Non-negative number validation
    nonNegativeNumber: zod_1.z.number().min(0, 'Must be non-negative'),
    // Percentage validation (0-100)
    percentage: zod_1.z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
    // Text with length constraints
    shortText: zod_1.z.string().min(1).max(100, 'Text must be between 1 and 100 characters'),
    mediumText: zod_1.z.string().min(1).max(500, 'Text must be between 1 and 500 characters'),
    longText: zod_1.z.string().min(1).max(2000, 'Text must be between 1 and 2000 characters'),
    // Optional text fields
    optionalShortText: zod_1.z.string().max(100, 'Text cannot exceed 100 characters').optional(),
    optionalMediumText: zod_1.z.string().max(500, 'Text cannot exceed 500 characters').optional(),
    optionalLongText: zod_1.z.string().max(2000, 'Text cannot exceed 2000 characters').optional(),
};
// ====== PAGINATION SCHEMAS ======
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/, 'Page must be a valid number').optional(),
    limit: zod_1.z.string().regex(/^\d+$/, 'Limit must be a valid number').optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    searchTerm: zod_1.z.string().optional(),
});
// ====== PARAMETER SCHEMAS ======
exports.paramSchemas = {
    // MongoDB ID parameter
    mongoIdParam: zod_1.z.object({
        params: zod_1.z.object({
            id: exports.commonValidators.mongoId,
        }),
    }),
    // User ID parameter
    userIdParam: zod_1.z.object({
        params: zod_1.z.object({
            userId: exports.commonValidators.mongoId,
        }),
    }),
    // Task ID parameter
    taskIdParam: zod_1.z.object({
        params: zod_1.z.object({
            taskId: exports.commonValidators.mongoId,
        }),
    }),
};
// ====== COMMON BODY SCHEMAS ======
exports.bodySchemas = {
    // Basic create/update patterns
    createWithName: zod_1.z.object({
        body: zod_1.z.object({
            name: exports.commonValidators.shortText,
            description: exports.commonValidators.optionalMediumText,
        }),
    }),
    updateWithName: zod_1.z.object({
        body: zod_1.z.object({
            name: exports.commonValidators.optionalShortText,
            description: exports.commonValidators.optionalMediumText,
        }),
    }),
    // Status update pattern
    statusUpdate: zod_1.z.object({
        body: zod_1.z.object({
            status: zod_1.z.string(),
            reason: exports.commonValidators.optionalMediumText,
        }),
    }),
    // Image upload pattern
    imageUpload: zod_1.z.object({
        body: zod_1.z.object({
            images: zod_1.z.array(exports.commonValidators.url).optional(),
        }),
    }),
};
// ====== QUERY SCHEMAS ======
exports.querySchemas = {
    // Basic list query with pagination
    basicListQuery: zod_1.z.object({
        query: exports.paginationQuerySchema,
    }),
    // List query with status filter
    statusFilterQuery: zod_1.z.object({
        query: exports.paginationQuerySchema.extend({
            status: zod_1.z.string().optional(),
        }),
    }),
    // List query with date range
    dateRangeQuery: zod_1.z.object({
        query: exports.paginationQuerySchema.extend({
            dateFrom: exports.commonValidators.dateString.optional(),
            dateTo: exports.commonValidators.dateString.optional(),
        }),
    }),
    // User-specific query
    userQuery: zod_1.z.object({
        query: exports.paginationQuerySchema.extend({
            userId: exports.commonValidators.mongoId.optional(),
        }),
    }),
};
// ====== COMPOSITE SCHEMAS ======
exports.compositeSchemas = {
    // Complete CRUD operation schemas
    createResource: (additionalFields = {}) => zod_1.z.object({
        body: zod_1.z.object(Object.assign({ name: exports.commonValidators.shortText, description: exports.commonValidators.optionalMediumText }, additionalFields)),
    }),
    updateResource: (additionalFields = {}) => zod_1.z.object(Object.assign(Object.assign({}, exports.paramSchemas.mongoIdParam.shape), { body: zod_1.z.object(Object.assign({ name: exports.commonValidators.optionalShortText, description: exports.commonValidators.optionalMediumText }, additionalFields)) })),
    // List with filters
    listWithFilters: (additionalFilters = {}) => zod_1.z.object({
        query: exports.paginationQuerySchema.extend(additionalFilters),
    }),
};
// ====== VALIDATION HELPERS ======
exports.validationHelpers = {
    /**
     * Creates a validation schema for array of MongoDB IDs
     */
    mongoIdArray: (fieldName = 'ids') => zod_1.z.array(exports.commonValidators.mongoId).min(1, `At least one ${fieldName} is required`),
    /**
     * Creates a conditional required field based on another field
     */
    conditionalRequired: (condition, field) => zod_1.z.union([field, zod_1.z.undefined()]).refine((val) => val !== undefined, { message: `Field is required when ${condition}` }),
    /**
     * Creates an enum validation with custom error message
     */
    enumWithMessage: (values, fieldName) => zod_1.z.enum(values, {
        errorMap: () => ({ message: `${fieldName} must be one of: ${values.join(', ')}` })
    }),
};
// ====== USAGE EXAMPLES ======
/*
// Example 1: Using common validators
const userSchema = z.object({
  body: z.object({
    email: commonValidators.email,
    password: commonValidators.password,
    phone: commonValidators.phone.optional(),
  }),
});

// Example 2: Using composite schemas
const createCategorySchema = compositeSchemas.createResource({
  icon: commonValidators.url.optional(),
  isActive: z.boolean().default(true),
});

// Example 3: Using parameter schemas
const getCategorySchema = paramSchemas.mongoIdParam;

// Example 4: Using query schemas with additional filters
const getCategoriesSchema = compositeSchemas.listWithFilters({
  isActive: z.boolean().optional(),
  parentId: commonValidators.mongoId.optional(),
});

// Example 5: Using validation helpers
const taskStatusSchema = z.object({
  body: z.object({
    status: validationHelpers.enumWithMessage(
      ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      'Task status'
    ),
  }),
});
*/
exports.default = {
    commonValidators: exports.commonValidators,
    paginationQuerySchema: exports.paginationQuerySchema,
    paramSchemas: exports.paramSchemas,
    bodySchemas: exports.bodySchemas,
    querySchemas: exports.querySchemas,
    compositeSchemas: exports.compositeSchemas,
    validationHelpers: exports.validationHelpers,
};
