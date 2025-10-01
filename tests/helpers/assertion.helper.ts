import { expect } from 'vitest';
import { Response } from 'supertest';

/**
 * Assertion Helper
 * 
 * Provides reusable assertion functions for common test scenarios.
 * Use this to create consistent assertions across all test files.
 */

/**
 * HTTP Response Assertions
 */
export const ResponseAssertions = {
  /**
   * Assert successful response (for integration tests)
   */
  assertSuccessResponse(response: Response, expectedStatus: number = 200): void {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  },

  /**
   * Assert successful response for unit tests (sendResponse mock)
   */
  assertSuccessResponseUnit(sendResponseMock: any, mockResponse: any, expectedData: any): void {
    expect(sendResponseMock).toHaveBeenCalledWith(mockResponse, expectedData);
  },

  /**
   * Assert error response
   */
  assertErrorResponse(response: Response, expectedStatus: number, expectedMessage?: string): void {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.success).toBe(false);
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
  },

  /**
   * Assert validation error response
   */
  assertValidationErrorResponse(response: Response): void {
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBeDefined();
    expect(response.body.errorMessages).toBeDefined();
  },

  /**
   * Assert unauthorized response
   */
  assertUnauthorizedResponse(response: Response): void {
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Unauthorized');
  },

  /**
   * Assert forbidden response
   */
  assertForbiddenResponse(response: Response): void {
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Forbidden');
  },

  /**
   * Assert not found response
   */
  assertNotFoundResponse(response: Response): void {
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('not found');
  },

  /**
   * Assert paginated response
   */
  assertPaginatedResponse(response: Response, expectedStatus: number = 200): void {
    this.assertSuccessResponse(response, expectedStatus);
    expect(response.body.meta).toBeDefined();
    expect(response.body.meta.total).toBeDefined();
    expect(response.body.meta.page).toBeDefined();
    expect(response.body.meta.limit).toBeDefined();
    expect(response.body.meta.totalPages).toBeDefined();
  },

  /**
   * Assert response has specific fields
   */
  assertResponseHasFields(response: Response, fields: string[]): void {
    fields.forEach(field => {
      expect(response.body.data).toHaveProperty(field);
    });
  },

  /**
   * Assert response doesn't have specific fields
   */
  assertResponseDoesNotHaveFields(response: Response, fields: string[]): void {
    fields.forEach(field => {
      expect(response.body.data).not.toHaveProperty(field);
    });
  },
};

/**
 * Database Object Assertions
 */
export const DatabaseAssertions = {
  /**
   * Assert user object structure
   */
  assertUserObject(user: any, expectedFields: string[] = []): void {
    const requiredFields = ['_id', 'name', 'email', 'role', 'verified', 'status'];
    const allFields = [...requiredFields, ...expectedFields];
    
    allFields.forEach(field => {
      expect(user).toHaveProperty(field);
    });

    // Ensure password is not exposed
    expect(user).not.toHaveProperty('password');
  },

  /**
   * Assert task object structure
   */
  assertTaskObject(task: any, expectedFields: string[] = []): void {
    const requiredFields = ['_id', 'title', 'description', 'taskBudget', 'taskLocation', 'userId', 'taskCategory', 'status'];
    const allFields = [...requiredFields, ...expectedFields];
    
    allFields.forEach(field => {
      expect(task).toHaveProperty(field);
    });
  },

  /**
   * Assert bid object structure
   */
  assertBidObject(bid: any, expectedFields: string[] = []): void {
    const requiredFields = ['_id', 'taskId', 'taskerId', 'amount', 'message', 'status'];
    const allFields = [...requiredFields, ...expectedFields];
    
    allFields.forEach(field => {
      expect(bid).toHaveProperty(field);
    });
  },

  /**
   * Assert category object structure
   */
  assertCategoryObject(category: any, expectedFields: string[] = []): void {
    const requiredFields = ['_id', 'name', 'description'];
    const allFields = [...requiredFields, ...expectedFields];
    
    allFields.forEach(field => {
      expect(category).toHaveProperty(field);
    });
  },

  /**
   * Assert object has timestamps
   */
  assertHasTimestamps(obj: any): void {
    expect(obj).toHaveProperty('createdAt');
    expect(obj).toHaveProperty('updatedAt');
    expect(new Date(obj.createdAt)).toBeInstanceOf(Date);
    expect(new Date(obj.updatedAt)).toBeInstanceOf(Date);
  },

  /**
   * Assert object is soft deleted
   */
  assertSoftDeleted(obj: any): void {
    expect(obj).toHaveProperty('isDeleted');
    expect(obj.isDeleted).toBe(true);
  },

  /**
   * Assert object is not soft deleted
   */
  assertNotSoftDeleted(obj: any): void {
    expect(obj).toHaveProperty('isDeleted');
    expect(obj.isDeleted).toBe(false);
  },
};

/**
 * Array Assertions
 */
export const ArrayAssertions = {
  /**
   * Assert array is not empty
   */
  assertArrayNotEmpty(arr: any[]): void {
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.length).toBeGreaterThan(0);
  },

  /**
   * Assert array is empty
   */
  assertArrayEmpty(arr: any[]): void {
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.length).toBe(0);
  },

  /**
   * Assert array has specific length
   */
  assertArrayLength(arr: any[], expectedLength: number): void {
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.length).toBe(expectedLength);
  },

  /**
   * Assert array contains object with property
   */
  assertArrayContainsObjectWithProperty(arr: any[], property: string, value: any): void {
    expect(Array.isArray(arr)).toBe(true);
    const found = arr.some(item => item[property] === value);
    expect(found).toBe(true);
  },

  /**
   * Assert array is sorted by property
   */
  assertArraySortedBy(arr: any[], property: string, order: 'asc' | 'desc' = 'asc'): void {
    expect(Array.isArray(arr)).toBe(true);
    
    for (let i = 1; i < arr.length; i++) {
      const current = arr[i][property];
      const previous = arr[i - 1][property];
      
      if (order === 'asc') {
        expect(current >= previous).toBe(true);
      } else {
        expect(current <= previous).toBe(true);
      }
    }
  },

  /**
   * Assert all array items have property
   */
  assertAllItemsHaveProperty(arr: any[], property: string): void {
    expect(Array.isArray(arr)).toBe(true);
    arr.forEach(item => {
      expect(item).toHaveProperty(property);
    });
  },
};

/**
 * Authentication Assertions
 */
export const AuthAssertions = {
  /**
   * Assert JWT token format
   */
  assertJWTToken(token: string): void {
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  },

  /**
   * Assert authenticated user object
   */
  assertAuthenticatedUser(user: any): void {
    expect(user).toHaveProperty('_id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('role');
    expect(user).toHaveProperty('token');
    this.assertJWTToken(user.token);
  },

  /**
   * Assert login response
   */
  assertLoginResponse(response: Response): void {
    ResponseAssertions.assertSuccessResponse(response, 200);
    expect(response.body.data).toHaveProperty('accessToken');
    this.assertJWTToken(response.body.data.accessToken);
  },

  /**
   * Assert logout response
   */
  assertLogoutResponse(response: Response): void {
    ResponseAssertions.assertSuccessResponse(response, 200);
    expect(response.body.message).toContain('logout');
  },
};

/**
 * Validation Assertions
 */
export const ValidationAssertions = {
  /**
   * Assert email format
   */
  assertEmailFormat(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(email)).toBe(true);
  },

  /**
   * Assert phone format
   */
  assertPhoneFormat(phone: string): void {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    expect(phoneRegex.test(phone)).toBe(true);
  },

  /**
   * Assert password strength
   */
  assertPasswordStrength(password: string, minLength: number = 8): void {
    expect(password.length).toBeGreaterThanOrEqual(minLength);
  },

  /**
   * Assert ObjectId format
   */
  assertObjectIdFormat(id: string): void {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    expect(objectIdRegex.test(id)).toBe(true);
  },

  /**
   * Assert positive number
   */
  assertPositiveNumber(value: number): void {
    expect(typeof value).toBe('number');
    expect(value).toBeGreaterThan(0);
  },

  /**
   * Assert non-negative number
   */
  assertNonNegativeNumber(value: number): void {
    expect(typeof value).toBe('number');
    expect(value).toBeGreaterThanOrEqual(0);
  },
};

/**
 * Mock Assertions
 */
export const MockAssertions = {
  /**
   * Assert mock function was called with specific arguments
   */
  assertCalledWith(mockFn: any, ...args: any[]): void {
    expect(mockFn).toHaveBeenCalledWith(...args);
  },

  /**
   * Assert mock function was called specific number of times
   */
  assertCalledTimes(mockFn: any, times: number): void {
    expect(mockFn).toHaveBeenCalledTimes(times);
  },

  /**
   * Assert mock function was called
   */
  assertCalled(mockFn: any): void {
    expect(mockFn).toHaveBeenCalled();
  },

  /**
   * Assert mock function was not called
   */
  assertNotCalled(mockFn: any): void {
    expect(mockFn).not.toHaveBeenCalled();
  },

  /**
   * Assert mock function returned specific value
   */
  assertReturnedWith(mockFn: any, value: any): void {
    expect(mockFn).toHaveReturnedWith(value);
  },

  /**
   * Assert service method was called with specific data
   */
  assertServiceCalled(serviceMock: any, expectedData: any): void {
    expect(serviceMock).toHaveBeenCalledWith(expectedData);
  },

  /**
   * Assert error was handled by next function
   */
  assertErrorHandled(nextMock: any, expectedError: any): void {
    expect(nextMock).toHaveBeenCalledWith(expectedError);
  },
};

/**
 * Performance Assertions
 */
export const PerformanceAssertions = {
  /**
   * Assert execution time is within limit
   */
  async assertExecutionTime<T>(
    fn: () => Promise<T>,
    maxTimeMs: number
  ): Promise<T> {
    const startTime = Date.now();
    const result = await fn();
    const executionTime = Date.now() - startTime;
    
    expect(executionTime).toBeLessThanOrEqual(maxTimeMs);
    return result;
  },

  /**
   * Assert memory usage is reasonable
   */
  assertMemoryUsage(maxMemoryMB: number): void {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    expect(heapUsedMB).toBeLessThanOrEqual(maxMemoryMB);
  },
};