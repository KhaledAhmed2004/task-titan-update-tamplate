import { vi, Mock } from 'vitest';
import { Request, Response } from 'express';

/**
 * Mock Helper
 * 
 * Provides reusable mock objects and utilities for unit testing.
 * Use this to create consistent mocks across all unit test files.
 */

/**
 * Express Request/Response Mock Factory
 */
export const MockExpressFactory = {
  /**
   * Create mock Express Request object
   */
  createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
    return {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: undefined,
      files: undefined,
      file: undefined,
      ...overrides,
    };
  },

  /**
   * Create mock Express Response object
   */
  createMockResponse(): Partial<Response> & { status: Mock; json: Mock } {
    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis(),
    };

    return mockResponse as any;
  },

  /**
   * Create mock Next function
   */
  createMockNext(): Mock {
    return vi.fn();
  },

  /**
   * Create complete Express mock set
   */
  createExpressMocks(requestOverrides: Partial<Request> = {}) {
    return {
      mockRequest: this.createMockRequest(requestOverrides),
      mockResponse: this.createMockResponse(),
      mockNext: this.createMockNext(),
    };
  },
};

/**
 * Service Mock Factory
 */
export const MockServiceFactory = {
  /**
   * Create mock service with common CRUD methods
   */
  createCrudServiceMock() {
    return {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    };
  },

  /**
   * Create mock user service
   */
  createUserServiceMock() {
    return {
      createUserToDB: vi.fn(),
      getAllUsersFromDB: vi.fn(),
      getSingleUserFromDB: vi.fn(),
      updateUserInDB: vi.fn(),
      deleteUserFromDB: vi.fn(),
      updateUserProfileInDB: vi.fn(),
      getUserProfileFromDB: vi.fn(),
      changeUserStatusInDB: vi.fn(),
    };
  },

  /**
   * Create mock auth service
   */
  createAuthServiceMock() {
    return {
      loginUser: vi.fn(),
      logoutUser: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerifyEmail: vi.fn(),
      forgetPassword: vi.fn(),
      resetPassword: vi.fn(),
      changePassword: vi.fn(),
      refreshToken: vi.fn(),
    };
  },

  /**
   * Create mock task service
   */
  createTaskServiceMock() {
    return {
      createTaskToDB: vi.fn(),
      getAllTasksFromDB: vi.fn(),
      getSingleTaskFromDB: vi.fn(),
      updateTaskInDB: vi.fn(),
      deleteTaskFromDB: vi.fn(),
      getTasksByUserFromDB: vi.fn(),
      searchTasksFromDB: vi.fn(),
    };
  },

  /**
   * Create mock bid service
   */
  createBidServiceMock() {
    return {
      createBidToDB: vi.fn(),
      getBidsByTaskFromDB: vi.fn(),
      getBidsByTaskerFromDB: vi.fn(),
      getSingleBidFromDB: vi.fn(),
      updateBidInDB: vi.fn(),
      deleteBidFromDB: vi.fn(),
      acceptBidInDB: vi.fn(),
    };
  },
};

/**
 * Database Mock Factory
 */
export const MockDatabaseFactory = {
  /**
   * Create mock Mongoose model
   */
  createMongooseModelMock() {
    return {
      create: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findOneAndDelete: vi.fn(),
      updateOne: vi.fn(),
      updateMany: vi.fn(),
      deleteOne: vi.fn(),
      deleteMany: vi.fn(),
      countDocuments: vi.fn(),
      aggregate: vi.fn(),
      populate: vi.fn(),
      sort: vi.fn(),
      limit: vi.fn(),
      skip: vi.fn(),
      select: vi.fn(),
      lean: vi.fn(),
      exec: vi.fn(),
    };
  },

  /**
   * Create mock query builder
   */
  createQueryBuilderMock() {
    const queryMock = {
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    };

    return queryMock;
  },
};

/**
 * External Service Mock Factory
 */
export const MockExternalServiceFactory = {
  /**
   * Create mock email service
   */
  createEmailServiceMock() {
    return {
      sendEmail: vi.fn(),
      sendVerificationEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      sendWelcomeEmail: vi.fn(),
    };
  },

  /**
   * Create mock file upload service
   */
  createFileUploadMock() {
    return {
      uploadSingle: vi.fn(),
      uploadMultiple: vi.fn(),
      deleteFile: vi.fn(),
      getFileUrl: vi.fn(),
    };
  },

  /**
   * Create mock payment service
   */
  createPaymentServiceMock() {
    return {
      createPaymentIntent: vi.fn(),
      confirmPayment: vi.fn(),
      refundPayment: vi.fn(),
      getPaymentStatus: vi.fn(),
    };
  },
};

/**
 * Mock Data Factory
 */
export const MockDataFactory = {
  /**
   * Create mock user data
   */
  createMockUser(overrides = {}) {
    return {
      _id: '64f123abc456def789012345',
      name: 'Test User',
      email: 'test@example.com',
      role: 'POSTER',
      verified: true,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create mock task data
   */
  createMockTask(overrides = {}) {
    return {
      _id: '64f123abc456def789012346',
      title: 'Test Task',
      description: 'Test task description',
      taskBudget: 100,
      taskLocation: 'Test Location',
      userId: '64f123abc456def789012345',
      taskCategory: '64f123abc456def789012347',
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create mock bid data
   */
  createMockBid(overrides = {}) {
    return {
      _id: '64f123abc456def789012348',
      taskId: '64f123abc456def789012346',
      taskerId: '64f123abc456def789012349',
      amount: 80,
      message: 'Test bid message',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create mock category data
   */
  createMockCategory(overrides = {}) {
    return {
      _id: '64f123abc456def789012347',
      name: 'Test Category',
      description: 'Test category description',
      icon: 'test-icon',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },
};

/**
 * Mock Utilities
 */
export const MockUtils = {
  /**
   * Reset all mocks
   */
  resetAllMocks() {
    vi.clearAllMocks();
  },

  /**
   * Mock console methods
   */
  mockConsole() {
    return {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    };
  },

  /**
   * Mock Date.now
   */
  mockDateNow(timestamp: number) {
    return vi.spyOn(Date, 'now').mockReturnValue(timestamp);
  },

  /**
   * Mock Math.random
   */
  mockMathRandom(value: number) {
    return vi.spyOn(Math, 'random').mockReturnValue(value);
  },

  /**
   * Create mock promise that resolves
   */
  createResolvedPromise<T>(value: T): Promise<T> {
    return Promise.resolve(value);
  },

  /**
   * Create mock promise that rejects
   */
  createRejectedPromise(error: any): Promise<never> {
    return Promise.reject(error);
  },
};

/**
 * Common Mock Patterns
 */
export const CommonMockPatterns = {
  /**
   * Mock successful database operation
   */
  mockSuccessfulDbOperation<T>(returnValue: T) {
    return vi.fn().mockResolvedValue(returnValue);
  },

  /**
   * Mock failed database operation
   */
  mockFailedDbOperation(error: Error) {
    return vi.fn().mockRejectedValue(error);
  },

  /**
   * Mock paginated response
   */
  mockPaginatedResponse<T>(data: T[], total: number, page: number = 1, limit: number = 10) {
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Mock API response
   */
  mockApiResponse<T>(data: T, success: boolean = true, message: string = 'Success') {
    return {
      success,
      message,
      data,
    };
  },
};