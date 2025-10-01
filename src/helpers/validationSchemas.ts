import { z } from 'zod';

/**
 * Common validation schemas for reuse across modules
 * This file contains frequently used validation patterns to reduce duplication
 */

// ====== COMMON FIELD VALIDATORS ======

export const commonValidators = {
  // MongoDB ObjectId validation
  mongoId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
  
  // Email validation
  email: z.string().email('Invalid email format'),
  
  // Password validation
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  
  // Phone number validation (basic)
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  
  // URL validation
  url: z.string().url('Invalid URL format'),
  
  // Date string validation
  dateString: z.string().datetime('Invalid date format'),
  
  // Positive number validation
  positiveNumber: z.number().positive('Must be a positive number'),
  
  // Non-negative number validation
  nonNegativeNumber: z.number().min(0, 'Must be non-negative'),
  
  // Percentage validation (0-100)
  percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  
  // Text with length constraints
  shortText: z.string().min(1).max(100, 'Text must be between 1 and 100 characters'),
  mediumText: z.string().min(1).max(500, 'Text must be between 1 and 500 characters'),
  longText: z.string().min(1).max(2000, 'Text must be between 1 and 2000 characters'),
  
  // Optional text fields
  optionalShortText: z.string().max(100, 'Text cannot exceed 100 characters').optional(),
  optionalMediumText: z.string().max(500, 'Text cannot exceed 500 characters').optional(),
  optionalLongText: z.string().max(2000, 'Text cannot exceed 2000 characters').optional(),
};

// ====== PAGINATION SCHEMAS ======

export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a valid number').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a valid number').optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  searchTerm: z.string().optional(),
});

// ====== PARAMETER SCHEMAS ======

export const paramSchemas = {
  // MongoDB ID parameter
  mongoIdParam: z.object({
    params: z.object({
      id: commonValidators.mongoId,
    }),
  }),
  
  // User ID parameter
  userIdParam: z.object({
    params: z.object({
      userId: commonValidators.mongoId,
    }),
  }),
  
  // Task ID parameter
  taskIdParam: z.object({
    params: z.object({
      taskId: commonValidators.mongoId,
    }),
  }),
};

// ====== COMMON BODY SCHEMAS ======

export const bodySchemas = {
  // Basic create/update patterns
  createWithName: z.object({
    body: z.object({
      name: commonValidators.shortText,
      description: commonValidators.optionalMediumText,
    }),
  }),
  
  updateWithName: z.object({
    body: z.object({
      name: commonValidators.optionalShortText,
      description: commonValidators.optionalMediumText,
    }),
  }),
  
  // Status update pattern
  statusUpdate: z.object({
    body: z.object({
      status: z.string(),
      reason: commonValidators.optionalMediumText,
    }),
  }),
  
  // Image upload pattern
  imageUpload: z.object({
    body: z.object({
      images: z.array(commonValidators.url).optional(),
    }),
  }),
};

// ====== QUERY SCHEMAS ======

export const querySchemas = {
  // Basic list query with pagination
  basicListQuery: z.object({
    query: paginationQuerySchema,
  }),
  
  // List query with status filter
  statusFilterQuery: z.object({
    query: paginationQuerySchema.extend({
      status: z.string().optional(),
    }),
  }),
  
  // List query with date range
  dateRangeQuery: z.object({
    query: paginationQuerySchema.extend({
      dateFrom: commonValidators.dateString.optional(),
      dateTo: commonValidators.dateString.optional(),
    }),
  }),
  
  // User-specific query
  userQuery: z.object({
    query: paginationQuerySchema.extend({
      userId: commonValidators.mongoId.optional(),
    }),
  }),
};

// ====== COMPOSITE SCHEMAS ======

export const compositeSchemas = {
  // Complete CRUD operation schemas
  createResource: (additionalFields: z.ZodRawShape = {}) => z.object({
    body: z.object({
      name: commonValidators.shortText,
      description: commonValidators.optionalMediumText,
      ...additionalFields,
    }),
  }),
  
  updateResource: (additionalFields: z.ZodRawShape = {}) => z.object({
    ...paramSchemas.mongoIdParam.shape,
    body: z.object({
      name: commonValidators.optionalShortText,
      description: commonValidators.optionalMediumText,
      ...additionalFields,
    }),
  }),
  
  // List with filters
  listWithFilters: (additionalFilters: z.ZodRawShape = {}) => z.object({
    query: paginationQuerySchema.extend(additionalFilters),
  }),
};

// ====== VALIDATION HELPERS ======

export const validationHelpers = {
  /**
   * Creates a validation schema for array of MongoDB IDs
   */
  mongoIdArray: (fieldName: string = 'ids') => 
    z.array(commonValidators.mongoId).min(1, `At least one ${fieldName} is required`),
  
  /**
   * Creates a conditional required field based on another field
   */
  conditionalRequired: (condition: string, field: z.ZodSchema) =>
    z.union([field, z.undefined()]).refine(
      (val) => val !== undefined,
      { message: `Field is required when ${condition}` }
    ),
  
  /**
   * Creates an enum validation with custom error message
   */
  enumWithMessage: (values: string[], fieldName: string) =>
    z.enum(values as [string, ...string[]], {
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

export default {
  commonValidators,
  paginationQuerySchema,
  paramSchemas,
  bodySchemas,
  querySchemas,
  compositeSchemas,
  validationHelpers,
};