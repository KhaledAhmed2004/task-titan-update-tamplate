import mongoose from 'mongoose';
import { User } from '../../../../src/app/modules/user/user.model';
import { IUser } from '../../../../src/app/modules/user/user.interface';
import { USER_ROLES } from '../../../../src/enums/user';
import { StatusCodes } from 'http-status-codes';

// Test Timeouts
export const TEST_TIMEOUTS = {
  DATABASE_SETUP: 30000,
  DATABASE_TEARDOWN: 30000,
  DEFAULT_TEST: 10000,
} as const;

// Test User Interface
export interface TestUser extends Partial<IUser> {
  _id: string; // Required after user creation
}

// Test Users Configuration
export const testUsers: Record<string, TestUser> = {
  poster: {
    name: 'Poster User',
    email: 'poster@test.com',
    password: 'password123',
    role: USER_ROLES.POSTER,
    location: 'Test City',
    phone: '+1234567890',
    _id: '', // Will be populated by setupTestUsers()
  },
  admin: {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: USER_ROLES.SUPER_ADMIN,
    location: 'Admin City',
    phone: '+1234567891',
    _id: '', // Will be populated by setupTestUsers()
  },
  tasker: {
    name: 'Tasker User',
    email: 'tasker@test.com',
    password: 'password123',
    role: USER_ROLES.TASKER,
    location: 'Tasker City',
    phone: '+1234567892',
    _id: '', // Will be populated by setupTestUsers()
  },
};

// Test Data
export const testData = {
  validUser: {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: USER_ROLES.POSTER,
    location: 'New York',
    phone: '+1234567890',
  },
  invalidUser: {
    name: '',
    email: 'invalid-email',
    password: '123',
    location: '',
    phone: 'invalid-contact',
  },
  maliciousUser: {
    name: '<script>alert("xss")</script>',
    email: 'malicious@example.com',
    password: 'password123',
    role: USER_ROLES.TASKER,
    location: 'Hacker City',
    phone: '+1234567890',
  },
  updateData: {
    name: 'Updated Name',
    location: 'Updated Location',
    phone: '+9876543210',
  },
  invalidEmails: [
    'plainaddress',
    '@missingdomain.com',
    'missing@.com',
    'missing@domain',
    'spaces @domain.com',
  ],
  requiredFields: ['name', 'email', 'password'],
} as const;

// Helper Functions
export async function setupTestUsers(): Promise<void> {
  try {
    for (const [key, userData] of Object.entries(testUsers)) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = await User.create(userData);
        testUsers[key]._id = user._id.toString();
      } else {
        testUsers[key]._id = existingUser._id.toString();
      }
    }
  } catch (error) {
    console.error('Error setting up test users:', error);
  }
}

export async function cleanupTestData(): Promise<void> {
  try {
    // Clean up any test users created during tests
    await User.deleteMany({
      email: { $regex: /@(test|example)\.com$/ },
    });
    
    // Reset test user IDs
    Object.keys(testUsers).forEach(key => {
      testUsers[key]._id = '';
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

export async function createTempUser(userData: Partial<IUser>): Promise<any> {
  try {
    const user = await User.create(userData);
    return user;
  } catch (error) {
    console.error('Error creating temp user:', error);
    throw error;
  }
}

// Response Assertion Helpers
export function assertSuccessResponse(
  response: any,
  expectedStatus: number = StatusCodes.OK
): void {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(true);
}

export function assertErrorResponse(response: any, expectedStatus: number): void {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(false);
}

// Status Code Validation Helper
export function validateStatusCode(response: any, expectedStatus: number | number[]): void {
  if (Array.isArray(expectedStatus)) {
    expect(expectedStatus).toContain(response.status);
  } else {
    expect(response.status).toBe(expectedStatus);
  }
}

// Generate Non-Existent ObjectId
export function generateNonExistentId(): string {
  return new mongoose.Types.ObjectId().toString();
}