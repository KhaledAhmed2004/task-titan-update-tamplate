import { USER_ROLES, USER_STATUS } from '../../src/enums/user';
import { TaskStatus } from '../../src/app/modules/task/task.interface';
import { BidStatus } from '../../src/app/modules/bid/bid.interface';

/**
 * Test Data Fixtures
 * 
 * Predefined test data that can be reused across multiple test files.
 * These fixtures provide consistent, realistic test data for various scenarios.
 */

/**
 * User Fixtures
 */
export const UserFixtures = {
  // Valid user data for different roles
  validPoster: {
    name: 'John Poster',
    email: 'john.poster@example.com',
    password: 'SecurePass123!',
    role: USER_ROLES.POSTER,
    location: 'New York, NY',
    phone: '+1234567890',
    status: USER_STATUS.ACTIVE,
    verified: true,
  },

  validTasker: {
    name: 'Jane Tasker',
    email: 'jane.tasker@example.com',
    password: 'SecurePass123!',
    role: USER_ROLES.TASKER,
    location: 'Los Angeles, CA',
    phone: '+1234567891',
    status: USER_STATUS.ACTIVE,
    verified: true,
  },

  validAdmin: {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    role: USER_ROLES.ADMIN,
    location: 'San Francisco, CA',
    phone: '+1234567892',
    status: USER_STATUS.ACTIVE,
    verified: true,
  },

  // Unverified user for testing verification flows
  unverifiedUser: {
    name: 'Unverified User',
    email: 'unverified@example.com',
    password: 'SecurePass123!',
    role: USER_ROLES.POSTER,
    location: 'Chicago, IL',
    phone: '+1234567893',
    status: USER_STATUS.ACTIVE,
    verified: false,
  },

  // Invalid user data for validation testing
  invalidUsers: {
    missingName: {
      email: 'missing.name@example.com',
      password: 'SecurePass123!',
      role: USER_ROLES.POSTER,
    },
    invalidEmail: {
      name: 'Invalid Email User',
      email: 'invalid-email',
      password: 'SecurePass123!',
      role: USER_ROLES.POSTER,
    },
    weakPassword: {
      name: 'Weak Password User',
      email: 'weak.password@example.com',
      password: '123',
      role: USER_ROLES.POSTER,
    },
    invalidRole: {
      name: 'Invalid Role User',
      email: 'invalid.role@example.com',
      password: 'SecurePass123!',
      role: 'INVALID_ROLE',
    },
  },

  // User update data
  updateData: {
    validUpdate: {
      name: 'Updated Name',
      location: 'Updated Location',
      phone: '+9876543210',
    },
    invalidUpdate: {
      email: 'cannot-update-email@example.com', // Email updates might not be allowed
    },
  },
};

/**
 * Category Fixtures
 */
export const CategoryFixtures = {
  validCategories: [
    {
      name: 'Home Cleaning',
      description: 'Professional home cleaning services',
      icon: 'cleaning-icon',
    },
    {
      name: 'Handyman Services',
      description: 'General repair and maintenance tasks',
      icon: 'handyman-icon',
    },
    {
      name: 'Pet Care',
      description: 'Pet sitting, walking, and care services',
      icon: 'pet-icon',
    },
    {
      name: 'Delivery Services',
      description: 'Package and food delivery services',
      icon: 'delivery-icon',
    },
  ],

  invalidCategories: {
    missingName: {
      description: 'Category without name',
      icon: 'test-icon',
    },
    emptyName: {
      name: '',
      description: 'Category with empty name',
      icon: 'test-icon',
    },
    missingDescription: {
      name: 'No Description Category',
      icon: 'test-icon',
    },
  },
};

/**
 * Task Fixtures
 */
export const TaskFixtures = {
  validTasks: [
    {
      title: 'House Cleaning Service',
      description: 'Need professional cleaning for a 3-bedroom house. Deep cleaning required including bathrooms, kitchen, and living areas.',
      taskBudget: 150,
      taskLocation: 'Manhattan, New York',
      latitude: 40.7831,
      longitude: -73.9712,
      status: TaskStatus.OPEN,
    },
    {
      title: 'Furniture Assembly',
      description: 'Need help assembling IKEA furniture - 1 wardrobe, 2 nightstands, and 1 desk. All tools will be provided.',
      taskBudget: 80,
      taskLocation: 'Brooklyn, New York',
      latitude: 40.6782,
      longitude: -73.9442,
      status: TaskStatus.OPEN,
    },
    {
      title: 'Dog Walking Service',
      description: 'Looking for someone to walk my golden retriever twice a day for a week while I\'m traveling.',
      taskBudget: 200,
      taskLocation: 'Queens, New York',
      latitude: 40.7282,
      longitude: -73.7949,
      status: TaskStatus.OPEN,
    },
  ],

  invalidTasks: {
    missingTitle: {
      description: 'Task without title',
      taskBudget: 100,
      taskLocation: 'Test Location',
    },
    emptyTitle: {
      title: '',
      description: 'Task with empty title',
      taskBudget: 100,
      taskLocation: 'Test Location',
    },
    missingDescription: {
      title: 'No Description Task',
      taskBudget: 100,
      taskLocation: 'Test Location',
    },
    invalidBudget: {
      title: 'Invalid Budget Task',
      description: 'Task with invalid budget',
      taskBudget: -50,
      taskLocation: 'Test Location',
    },
    missingLocation: {
      title: 'No Location Task',
      description: 'Task without location',
      taskBudget: 100,
    },
  },

  updateData: {
    validUpdate: {
      title: 'Updated Task Title',
      description: 'Updated task description',
      taskBudget: 120,
    },
    statusUpdate: {
      status: TaskStatus.IN_PROGRESS,
    },
  },
};

/**
 * Bid Fixtures
 */
export const BidFixtures = {
  validBids: [
    {
      amount: 120,
      message: 'I have 5 years of experience in house cleaning and can complete this task efficiently with high quality results.',
      status: BidStatus.PENDING,
    },
    {
      amount: 140,
      message: 'Professional cleaning service with eco-friendly products. Available this weekend.',
      status: BidStatus.PENDING,
    },
    {
      amount: 100,
      message: 'Competitive pricing with satisfaction guarantee. Can start immediately.',
      status: BidStatus.PENDING,
    },
  ],

  invalidBids: {
    missingAmount: {
      message: 'Bid without amount',
      status: BidStatus.PENDING,
    },
    invalidAmount: {
      amount: -50,
      message: 'Bid with negative amount',
      status: BidStatus.PENDING,
    },
    missingMessage: {
      amount: 100,
      status: BidStatus.PENDING,
    },
    emptyMessage: {
      amount: 100,
      message: '',
      status: BidStatus.PENDING,
    },
  },

  updateData: {
    validUpdate: {
      amount: 110,
      message: 'Updated bid with better pricing',
    },
    statusUpdate: {
      status: BidStatus.ACCEPTED,
    },
  },
};

/**
 * Authentication Fixtures
 */
export const AuthFixtures = {
  loginCredentials: {
    validPoster: {
      email: 'john.poster@example.com',
      password: 'SecurePass123!',
    },
    validTasker: {
      email: 'jane.tasker@example.com',
      password: 'SecurePass123!',
    },
    validAdmin: {
      email: 'admin@example.com',
      password: 'AdminPass123!',
    },
    invalidEmail: {
      email: 'nonexistent@example.com',
      password: 'SecurePass123!',
    },
    invalidPassword: {
      email: 'john.poster@example.com',
      password: 'WrongPassword',
    },
    missingEmail: {
      password: 'SecurePass123!',
    },
    missingPassword: {
      email: 'john.poster@example.com',
    },
  },

  registrationData: {
    validRegistration: {
      name: 'New User',
      email: 'new.user@example.com',
      password: 'NewUserPass123!',
      role: USER_ROLES.POSTER,
      location: 'Boston, MA',
      phone: '+1234567894',
    },
    duplicateEmail: {
      name: 'Duplicate Email User',
      email: 'john.poster@example.com', // Already exists
      password: 'SecurePass123!',
      role: USER_ROLES.POSTER,
    },
  },

  passwordReset: {
    validEmail: 'john.poster@example.com',
    invalidEmail: 'nonexistent@example.com',
    newPassword: 'NewSecurePass123!',
    weakPassword: '123',
  },

  emailVerification: {
    validOTP: 123456,
    invalidOTP: 999999,
    expiredOTP: 111111,
  },
};

/**
 * API Response Fixtures
 */
export const ResponseFixtures = {
  successResponse: {
    success: true,
    message: 'Operation completed successfully',
    data: {},
  },

  errorResponse: {
    success: false,
    message: 'Operation failed',
    errorMessages: [],
  },

  validationErrorResponse: {
    success: false,
    message: 'Validation failed',
    errorMessages: [
      {
        path: 'email',
        message: 'Email is required',
      },
      {
        path: 'password',
        message: 'Password must be at least 8 characters',
      },
    ],
  },

  paginatedResponse: {
    success: true,
    message: 'Data retrieved successfully',
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
  },
};

/**
 * Test Scenarios
 */
export const TestScenarios = {
  // Complete user journey scenarios
  userRegistrationFlow: {
    step1: 'Register new user',
    step2: 'Verify email with OTP',
    step3: 'Login with verified account',
    step4: 'Update user profile',
  },

  taskCreationFlow: {
    step1: 'Login as poster',
    step2: 'Create new task',
    step3: 'Verify task is created',
    step4: 'Update task details',
  },

  biddingFlow: {
    step1: 'Login as poster and create task',
    step2: 'Login as tasker and create bid',
    step3: 'Login as poster and view bids',
    step4: 'Accept a bid',
    step5: 'Verify task status updated',
  },

  // Error scenarios
  unauthorizedAccess: {
    description: 'Attempt to access protected routes without authentication',
    expectedStatus: 401,
  },

  forbiddenAccess: {
    description: 'Attempt to access resources with insufficient permissions',
    expectedStatus: 403,
  },

  resourceNotFound: {
    description: 'Attempt to access non-existent resources',
    expectedStatus: 404,
  },

  validationErrors: {
    description: 'Submit invalid data to API endpoints',
    expectedStatus: 400,
  },
};

/**
 * Performance Test Data
 */
export const PerformanceFixtures = {
  loadTestData: {
    userCount: 100,
    taskCount: 500,
    bidCount: 1000,
    concurrentRequests: 50,
  },

  stressTestData: {
    userCount: 1000,
    taskCount: 5000,
    bidCount: 10000,
    concurrentRequests: 200,
  },

  timeoutLimits: {
    databaseOperation: 5000, // 5 seconds
    apiRequest: 10000, // 10 seconds
    fileUpload: 30000, // 30 seconds
  },
};