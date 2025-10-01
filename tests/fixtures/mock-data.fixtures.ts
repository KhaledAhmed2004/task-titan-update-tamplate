import { USER_ROLES, USER_STATUS } from '../../src/enums/user';
import { TaskStatus } from '../../src/app/modules/task/task.interface';
import { BidStatus } from '../../src/app/modules/bid/bid.interface';

// Mock User Objects
export const MockUserFixtures = {
  poster: {
    _id: '64f123abc456def789012345',
    name: 'John Poster',
    email: 'john.poster@example.com',
    role: USER_ROLES.POSTER,
    location: 'New York, NY',
    phone: '+1234567890',
    status: USER_STATUS.ACTIVE,
    verified: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },

  tasker: {
    _id: '64f123abc456def789012346',
    name: 'Jane Tasker',
    email: 'jane.tasker@example.com',
    role: USER_ROLES.TASKER,
    location: 'Los Angeles, CA',
    phone: '+1234567891',
    status: USER_STATUS.ACTIVE,
    verified: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },

  admin: {
    _id: '64f123abc456def789012347',
    name: 'Admin User',
    email: 'admin@example.com',
    role: USER_ROLES.SUPER_ADMIN,
    location: 'San Francisco, CA',
    phone: '+1234567892',
    status: USER_STATUS.ACTIVE,
    verified: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },

  unverifiedUser: {
    _id: '64f123abc456def789012348',
    name: 'Unverified User',
    email: 'unverified@example.com',
    role: USER_ROLES.POSTER,
    location: 'Chicago, IL',
    phone: '+1234567893',
    status: USER_STATUS.ACTIVE,
    verified: false,
    authentication: {
      isResetPassword: false,
      oneTimeCode: 123456,
      expireAt: new Date(Date.now() + 5 * 60000),
    },
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },

  inactiveUser: {
    _id: '64f123abc456def789012349',
    name: 'Inactive User',
    email: 'inactive@example.com',
    role: USER_ROLES.POSTER,
    status: USER_STATUS.INACTIVE,
    verified: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },
};

// Mock Category Objects
export const MockCategoryFixtures = {
  cleaning: {
    _id: '64f123abc456def789012350',
    name: 'Home Cleaning',
    description: 'Professional home cleaning services',
    icon: 'cleaning-icon',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },

  handyman: {
    _id: '64f123abc456def789012351',
    name: 'Handyman Services',
    description: 'General repair and maintenance tasks',
    icon: 'handyman-icon',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },

  petCare: {
    _id: '64f123abc456def789012352',
    name: 'Pet Care',
    description: 'Pet sitting, walking, and care services',
    icon: 'pet-icon',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },
};

// Mock Task Objects
export const MockTaskFixtures = {
  openTask: {
    _id: '64f123abc456def789012353',
    title: 'House Cleaning Service',
    description: 'Need professional cleaning for a 3-bedroom house.',
    taskBudget: 150,
    taskLocation: 'Manhattan, New York',
    latitude: 40.7831,
    longitude: -73.9712,
    userId: MockUserFixtures.poster._id,
    taskCategory: MockCategoryFixtures.cleaning._id,
    status: TaskStatus.OPEN,
    isDeleted: false,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },

  inProgressTask: {
    _id: '64f123abc456def789012354',
    title: 'Furniture Assembly',
    description: 'Need help assembling IKEA furniture.',
    taskBudget: 80,
    taskLocation: 'Brooklyn, New York',
    latitude: 40.6782,
    longitude: -73.9442,
    userId: MockUserFixtures.poster._id,
    taskCategory: MockCategoryFixtures.handyman._id,
    status: TaskStatus.IN_PROGRESS,
    isDeleted: false,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },

  completedTask: {
    _id: '64f123abc456def789012355',
    title: 'Dog Walking Service',
    description: 'Looking for someone to walk my golden retriever.',
    taskBudget: 200,
    taskLocation: 'Queens, New York',
    latitude: 40.7282,
    longitude: -73.7949,
    userId: MockUserFixtures.poster._id,
    taskCategory: MockCategoryFixtures.petCare._id,
    status: TaskStatus.COMPLETED,
    isDeleted: false,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },

  deletedTask: {
    _id: '64f123abc456def789012356',
    title: 'Deleted Task',
    description: 'This task has been deleted.',
    taskBudget: 100,
    taskLocation: 'Test Location',
    userId: MockUserFixtures.poster._id,
    taskCategory: MockCategoryFixtures.cleaning._id,
    status: TaskStatus.OPEN,
    isDeleted: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },
};

// Mock Bid Objects
export const MockBidFixtures = {
  pendingBid: {
    _id: '64f123abc456def789012357',
    taskId: MockTaskFixtures.openTask._id,
    taskerId: MockUserFixtures.tasker._id,
    amount: 120,
    message: 'I have 5 years of experience in house cleaning.',
    status: BidStatus.PENDING,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },

  acceptedBid: {
    _id: '64f123abc456def789012358',
    taskId: MockTaskFixtures.inProgressTask._id,
    taskerId: MockUserFixtures.tasker._id,
    amount: 80,
    message: 'Professional furniture assembly service.',
    status: BidStatus.ACCEPTED,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },

  rejectedBid: {
    _id: '64f123abc456def789012359',
    taskId: MockTaskFixtures.openTask._id,
    taskerId: MockUserFixtures.tasker._id,
    amount: 200,
    message: 'High-quality service with premium pricing.',
    status: BidStatus.REJECTED,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },
};

// Mock Reset Token Objects
export const MockResetTokenFixtures = {
  validToken: {
    _id: '64f123abc456def789012360',
    userId: MockUserFixtures.poster._id,
    token: 'valid-reset-token-123',
    expireAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },

  expiredToken: {
    _id: '64f123abc456def789012361',
    userId: MockUserFixtures.poster._id,
    token: 'expired-reset-token-123',
    expireAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },
};

// Mock JWT Tokens
export const MockTokenFixtures = {
  validAccessToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  expiredAccessToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ',
  invalidToken: 'invalid.token.here',
  malformedToken: 'not-a-jwt-token',
};

// Mock API Responses
export const MockResponseFixtures = {
  successResponse: {
    success: true,
    statusCode: 200,
    message: 'Operation completed successfully',
    data: MockUserFixtures.poster,
  },

  createdResponse: {
    success: true,
    statusCode: 201,
    message: 'Resource created successfully',
    data: MockUserFixtures.poster,
  },

  errorResponse: {
    success: false,
    statusCode: 400,
    message: 'Bad request',
    errorMessages: [
      {
        path: 'email',
        message: 'Email is required',
      },
    ],
  },

  unauthorizedResponse: {
    success: false,
    statusCode: 401,
    message: 'Unauthorized access',
  },

  forbiddenResponse: {
    success: false,
    statusCode: 403,
    message: 'Forbidden access',
  },

  notFoundResponse: {
    success: false,
    statusCode: 404,
    message: 'Resource not found',
  },

  paginatedResponse: {
    success: true,
    statusCode: 200,
    message: 'Data retrieved successfully',
    data: [MockUserFixtures.poster, MockUserFixtures.tasker],
    meta: {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  },
};

// Mock Database Query Results
export const MockQueryFixtures = {
  findOneResult: MockUserFixtures.poster,
  findManyResult: [MockUserFixtures.poster, MockUserFixtures.tasker],
  emptyResult: null,
  emptyArrayResult: [],

  countResult: 5,

  aggregateResult: [
    {
      _id: 'POSTER',
      count: 10,
    },
    {
      _id: 'TASKER',
      count: 15,
    },
  ],

  populatedResult: {
    ...MockTaskFixtures.openTask,
    userId: MockUserFixtures.poster,
    taskCategory: MockCategoryFixtures.cleaning,
  },
};

// Mock File Upload Data
export const MockFileFixtures = {
  validImage: {
    fieldname: 'profileImage',
    originalname: 'profile.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024000, // 1MB
    buffer: Buffer.from('fake-image-data'),
    filename: 'profile-123456.jpg',
    path: '/uploads/profile-123456.jpg',
  },

  invalidFile: {
    fieldname: 'document',
    originalname: 'malicious.exe',
    encoding: '7bit',
    mimetype: 'application/x-msdownload',
    size: 5000000, // 5MB
    buffer: Buffer.from('fake-executable-data'),
  },

  oversizedFile: {
    fieldname: 'image',
    originalname: 'large-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 10000000, // 10MB
    buffer: Buffer.alloc(10000000),
  },
};

// Mock Email Data
export const MockEmailFixtures = {
  verificationEmail: {
    to: 'user@example.com',
    subject: 'Email Verification',
    template: 'verification',
    data: {
      name: 'John Doe',
      otp: 123456,
    },
  },

  passwordResetEmail: {
    to: 'user@example.com',
    subject: 'Password Reset',
    template: 'password-reset',
    data: {
      name: 'John Doe',
      resetLink: 'https://example.com/reset-password?token=abc123',
    },
  },

  welcomeEmail: {
    to: 'user@example.com',
    subject: 'Welcome to Task Titans',
    template: 'welcome',
    data: {
      name: 'John Doe',
    },
  },
};

// Mock Error Objects
export const MockErrorFixtures = {
  validationError: {
    name: 'ValidationError',
    message: 'Validation failed',
    errors: {
      email: {
        message: 'Email is required',
        path: 'email',
        value: '',
      },
      password: {
        message: 'Password must be at least 8 characters',
        path: 'password',
        value: '123',
      },
    },
  },

  castError: {
    name: 'CastError',
    message: 'Cast to ObjectId failed',
    path: '_id',
    value: 'invalid-id',
  },

  duplicateKeyError: {
    name: 'MongoServerError',
    code: 11000,
    message: 'E11000 duplicate key error',
    keyPattern: { email: 1 },
    keyValue: { email: 'duplicate@example.com' },
  },

  jwtError: {
    name: 'JsonWebTokenError',
    message: 'invalid token',
  },

  tokenExpiredError: {
    name: 'TokenExpiredError',
    message: 'jwt expired',
    expiredAt: new Date(),
  },
};

// Mock External Service Responses

export const MockExternalServiceFixtures = {
  emailServiceSuccess: {
    messageId: 'email-123456',
    status: 'sent',
    response: '250 OK',
  },

  emailServiceError: {
    error: 'SMTP connection failed',
    code: 'ECONNREFUSED',
  },

  paymentServiceSuccess: {
    id: 'payment-123456',
    status: 'succeeded',
    amount: 10000, // $100.00 in cents
    currency: 'usd',
  },

  paymentServiceError: {
    error: 'Your card was declined',
    code: 'card_declined',
    decline_code: 'insufficient_funds',
  },

  fileUploadSuccess: {
    url: 'https://cdn.example.com/uploads/file-123456.jpg',
    key: 'uploads/file-123456.jpg',
    size: 1024000,
  },

  fileUploadError: {
    error: 'File too large',
    code: 'LIMIT_FILE_SIZE',
    limit: 5000000,
  },
};
