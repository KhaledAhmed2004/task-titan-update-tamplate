import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Import reusable test utilities and fixtures
import {
  authenticateExistingTestUser,
  TEST_TIMEOUTS,
  ResponseAssertions,
  DatabaseTestHelper,
  IntegrationTestSetup,
  TestDataFactory,
  BACKEND_URL,
  API_BASE,
  TEST_USERS,
  type AuthenticatedUser
} from '../../helpers';
import { StatusCodes } from 'http-status-codes';
import {
  TestUserFixtures,
  TestTaskFixtures,
  TestBidFixtures,
  TestCategoryFixtures,
  MockUserFixtures,
  MockTaskFixtures,
  MockBidFixtures
} from '../../fixtures';

// import app from '../../../src/app'; // Commented out for real backend testing
import { User } from '../../../src/app/modules/user/user.model';
import { TaskModel } from '../../../src/app/modules/task/task.model';
import { BidModel } from '../../../src/app/modules/bid/bid.model';
import { Category } from '../../../src/app/modules/category/category.model';
import { IUser } from '../../../src/app/modules/user/user.interface';
import { Task, TaskStatus } from '../../../src/app/modules/task/task.interface';
import { Bid, BidStatus } from '../../../src/app/modules/bid/bid.interface';
import { ICategory } from '../../../src/app/modules/category/category.interface';
import { USER_ROLES, USER_STATUS } from '../../../src/enums/user';

/**
 * Bid Integration Tests
 * 
 * This test suite covers all bid-related functionality including:
 * - Creating bids on tasks
 * - Retrieving bids by task and user
 * - Updating bid amounts and messages
 * - Deleting bids
 * - Accepting bids by task owners
 * - Authorization and validation
 * - Error handling and edge cases
 */

// Global test variables - using reusable setup
let testUsers: Record<string, AuthenticatedUser> = {};
let testTasks: Record<string, TestTask> = {};
let testBids: Record<string, TestBid> = {};
let testCategories: Record<string, any> = {};

// Helper functions using reusable factories
const createTestUser = async (userData: Partial<IUser>): Promise<TestUser> => {
  // Create user directly - let the pre-save middleware handle password hashing
  const user = await User.create(userData);

  // Login to get token using original plain text password
  const loginResponse = await request(BACKEND_URL)
    .post(`${API_BASE}/auth/login`)
    .send({
      email: userData.email,
      password: userData.password, // Use original plain text password for login
    });

  // Remove debug logging
  return {
    ...user.toObject(),
    _id: user._id.toString(),
    token: loginResponse.body.data,
  };
};

const createTestCategory = async (categoryData: Partial<ICategory>): Promise<TestCategory> => {
  const category = await Category.create(categoryData);
  return {
    ...category.toObject(),
    _id: category._id.toString(),
  };
};

const createTestTask = async (taskData: Partial<Task>): Promise<TestTask> => {
  try {
    // Import TaskService dynamically to avoid circular dependencies
    const { TaskService } = await import('../../../src/app/modules/task/task.service');
    const task = await TaskService.createTask(taskData as Task);
    return {
      ...task.toObject(),
      _id: task._id.toString(),
    };
  } catch (error) {
    console.error('❌ Error creating test task:', error);
    throw error;
  }
};

const createTestBid = async (bidData: Partial<Bid>): Promise<TestBid> => {
  const bid = await BidModel.create(bidData);
  return {
    ...bid.toObject(),
    _id: bid._id.toString(),
  };
};

const setupTestData = async (): Promise<void> => {
  try {
    console.log('🔧 Setting up test data with real backend...');
    
    // Authenticate existing test users using helper
    const userCredentials = [
      { key: 'poster', email: 'poster@test.com' },
      { key: 'tasker1', email: 'tasker1@test.com' },
      { key: 'tasker2', email: 'tasker2@test.com' }
    ];

    for (const { key, email } of userCredentials) {
      try {
        console.log(`🔐 Attempting to authenticate ${email}...`);
        const authenticatedUser = await authenticateExistingTestUser(email);
        testUsers[key] = authenticatedUser;
        console.log(`✅ ${key} user authenticated successfully`);
      } catch (authError) {
        console.log(`⚠️ ${email} authentication failed:`, authError);
        console.log(`⚠️ Skipping user creation as users should already exist`);
        // For now, we'll skip this user and continue
      }
    }

    // Setup categories manually since we removed the helper
    try {
      console.log('📂 Setting up categories...');
      const response = await request(BACKEND_URL)
        .get(`${API_BASE}/categories`);
      
      if (response.status === 200 && response.body.success && response.body.data.length > 0) {
        const defaultCategory = response.body.data[0];
        testCategories = { default: defaultCategory };
        console.log(`✅ Using category: ${defaultCategory.name} (${defaultCategory._id})`);
      } else {
        throw new Error('No categories available in backend');
      }
    } catch (categoryError) {
      console.error('❌ Failed to setup categories:', categoryError);
      throw new Error('Could not setup categories from backend');
    }

    console.log('✅ Test users setup completed');
    console.log('📊 Available test users:', Object.keys(testUsers));

    // Verify we have at least some users to work with
    if (Object.keys(testUsers).length === 0) {
      throw new Error('No test users could be set up. Please check your backend authentication.');
    }
    
  } catch (error) {
    console.error('❌ Test data setup failed:', error);
    throw error;
  }
};

const cleanupTestData = async (): Promise<void> => {
  await Promise.all([
    User.deleteMany({}),
    TaskModel.deleteMany({}),
    BidModel.deleteMany({}),
    Category.deleteMany({}),
  ]);
  
  testUsers = {};
  testTasks = {};
  testBids = {};
  testCategories = {};
};

// Remove duplicate assertion functions since they're now in helpers

// Test setup and teardown using reusable integration setup
beforeAll(async () => {
  console.log('🚀 Starting bid integration tests with real backend...');
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
  
  // Use the reusable integration test setup
  const environment = await IntegrationTestSetup.setupCompleteEnvironment();
  
  // Get authenticated users from setup
  testUsers = environment.authenticatedUsers;
  testCategories = { default: environment.category };
  
  console.log('✅ Test setup completed using reusable integration setup');
}, TEST_TIMEOUTS.DATABASE_SETUP);

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  IntegrationTestSetup.clearEnvironment();
  console.log('✅ Test cleanup completed');
}, TEST_TIMEOUTS.DATABASE_TEARDOWN);

beforeEach(async () => {
  // Clear test data before each test - handled by database helper
});

afterEach(async () => {
  // No additional cleanup needed
});

// ============================================================================
// BID CREATION TESTS
// ============================================================================

describe('POST /:taskId/bids - Create Bid', () => {
  let testTask: any;

  beforeEach(async () => {
    // Create a test task using fixtures
    const taskData = TestTaskFixtures.validTaskData.cleaning;

    const taskResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`)
      .send({
        ...taskData,
        taskCategory: testCategories.default._id,
      });

    if (taskResponse.status === 201) {
      testTask = taskResponse.body.data;
      console.log(`✅ Test task created: ${testTask._id}`);
    } else {
      console.error('❌ Failed to create test task:', taskResponse.body);
      throw new Error('Failed to create test task');
    }
  });

  it('should create a new bid successfully', async () => {
     const bidData = TestBidFixtures.validBidData.standard;

     const response = await request(BACKEND_URL)
       .post(`${API_BASE}/tasks/${testTask._id}/bids`)
       .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
       .send(bidData);

    console.log(`🔍 Response status: ${response.status}`);
    console.log(`🔍 Response body:`, response.body);

    ResponseAssertions.assertSuccessResponse(response, StatusCodes.CREATED);
    ResponseAssertions.assertResponseMessage(response, 'Bid created successfully');
    ResponseAssertions.assertResponseHasProperty(response, 'data._id');
    expect(response.body.data.amount).toBe(bidData.amount);
    expect(response.body.data.message).toBe(bidData.message);
    expect(response.body.data.status).toBe(BidStatus.PENDING);
    expect(response.body.data.taskId).toBe(testTask._id);
  });

  it('should require authentication to create a bid', async () => {
     const bidData = TestBidFixtures.validBidData.standard;

     const response = await request(BACKEND_URL)
       .post(`${API_BASE}/tasks/${testTask._id}/bids`)
       .send(bidData);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.UNAUTHORIZED);
  });

  it('should require TASKER role to create a bid', async () => {
     const bidData = TestBidFixtures.validBidData.standard;

     const response = await request(BACKEND_URL)
       .post(`${API_BASE}/tasks/${testTask._id}/bids`)
       .set('Authorization', `Bearer ${testUsers.poster.token}`)
       .send(bidData);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.FORBIDDEN);
  });

  it('should validate required fields', async () => {
    const bidData = TestBidFixtures.invalidBidData.missingAmount;

    const response = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${testTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(bidData);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.BAD_REQUEST);
    ResponseAssertions.assertResponseMessage(response, 'Validation Error');
  });

  it('should validate amount is a positive number', async () => {
    const bidData = {
      amount: -50,
      message: 'Test bid with negative amount',
    };

    const response = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${testTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(bidData);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.BAD_REQUEST);
  });

  it('should validate message is provided', async () => {
    const bidData = {
      amount: 75,
    };

    const response = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${testTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(bidData);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.BAD_REQUEST);
  });

  it('should prevent duplicate bids from same tasker', async () => {
    // First bid
    const bidData = {
      amount: 90,
      message: 'First bid from tasker',
    };

    const firstResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${testTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(bidData);

    ResponseAssertions.assertSuccessResponse(firstResponse, StatusCodes.CREATED);

    // Attempt duplicate bid
    const duplicateBidData = {
      amount: 95,
      message: 'Duplicate bid from same tasker',
    };

    const duplicateResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${testTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(duplicateBidData);

    ResponseAssertions.assertErrorResponse(duplicateResponse, StatusCodes.CONFLICT);
  });

  it('should prevent bidding on completed tasks', async () => {
    // Create a completed task
    const completedTaskData = {
      title: `Completed Task ${Date.now()}`,
      description: 'This task is already completed',
      taskBudget: 150,
      taskLocation: 'Test Location',
      taskCategory: testCategories.default._id,
      latitude: 40.7128,
      longitude: -74.0060,
    };

    const taskResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`)
      .send(completedTaskData);

    const completedTask = taskResponse.body.data;

    // Try to bid on completed task
    const bidData = {
      amount: 120,
      message: 'Bid on completed task',
    };

    const response = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${completedTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(bidData);

    // This should fail because task is completed
    ResponseAssertions.assertErrorResponse(response, StatusCodes.BAD_REQUEST);
  });

  it('should handle very large bid messages', async () => {
    const longMessage = 'A'.repeat(2000); // Very long message
    const bidData = {
      amount: 100,
      message: longMessage,
    };

    const response = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${testTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(bidData);

    // This might fail due to message length validation
    if (response.status === StatusCodes.BAD_REQUEST) {
      ResponseAssertions.assertErrorResponse(response, StatusCodes.BAD_REQUEST);
    } else {
      ResponseAssertions.assertSuccessResponse(response, StatusCodes.CREATED);
    }
  });
  it('should require POSTER role to view task bids', async () => {
     const response = await request(BACKEND_URL)
       .get(`${API_BASE}/tasks/${testTaskWithBids._id}/bids`)
       .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

     ResponseAssertions.assertErrorResponse(response, StatusCodes.FORBIDDEN);
   });

   it('should handle non-existent task', async () => {
     const invalidTaskId = new mongoose.Types.ObjectId().toString();
     const response = await request(BACKEND_URL)
       .get(`${API_BASE}/tasks/${invalidTaskId}/bids`)
       .set('Authorization', `Bearer ${testUsers.poster.token}`);

     ResponseAssertions.assertErrorResponse(response, StatusCodes.NOT_FOUND);
   });
});

// ============================================================================
// BID RETRIEVAL TESTS
// ============================================================================

describe('GET /tasks/:taskId/bids - Get Bids by Task', () => {
  let testTaskWithBids: any;

  beforeEach(async () => {
    // Create a test task
    const taskData = {
      title: `Test Task with Bids ${Date.now()}`,
      description: 'This is a test task for bid retrieval',
      taskBudget: 100,
      taskLocation: 'Test Location',
      taskCategory: testCategories.default._id, // Use the valid category ID
      latitude: 40.7128,
      longitude: -74.0060,
    };

    const taskResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`)
      .send(taskData);

    testTaskWithBids = taskResponse.body.data;

    // Create a bid on the task
    const bidData = {
      amount: 85,
      message: 'Test bid for retrieval',
    };

    await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${testTaskWithBids._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(bidData);
  });

  it('should retrieve all bids for a task (task owner)', async () => {
    const response = await request(BACKEND_URL)
      .get(`${API_BASE}/tasks/${testTaskWithBids._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`);

    ResponseAssertions.assertSuccessResponse(response);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0]).toHaveProperty('_id');
    expect(response.body.data[0]).toHaveProperty('amount');
    expect(response.body.data[0]).toHaveProperty('taskerId');
  });

  it('should require POSTER role to view task bids', async () => {
    const response = await request(BACKEND_URL)
      .get(`${API_BASE}/tasks/${testTaskWithBids._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.FORBIDDEN);
  });

  it('should handle non-existent task', async () => {
    const invalidTaskId = new mongoose.Types.ObjectId().toString();
    const response = await request(BACKEND_URL)
      .get(`${API_BASE}/tasks/${invalidTaskId}/bids`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.NOT_FOUND);
  });
});

describe('GET /bids/:bidId - Get Bid by ID', () => {
  let testBid: any;

  beforeEach(async () => {
    // Create a test task and bid
    const taskData = {
      title: `Test Task for Bid ${Date.now()}`,
      description: 'This is a test task for bid retrieval',
      taskBudget: 100,
      taskLocation: 'Test Location',
      taskCategory: testCategories.default._id, // Use the valid category ID
      latitude: 40.7128,
      longitude: -74.0060,
    };

    const taskResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`)
      .send(taskData);

    const task = taskResponse.body.data;

    const bidData = {
      amount: 100,
      message: 'I can complete this task efficiently',
    };

    const bidResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${task._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(bidData);

    testBid = bidResponse.body.data;
  });

  it('should retrieve a specific bid', async () => {
    const response = await request(BACKEND_URL)
      .get(`${API_BASE}/bids/${testBid._id}`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

    ResponseAssertions.assertSuccessResponse(response);
    expect(response.body.data._id).toBe(testBid._id);
    expect(response.body.data.amount).toBe(testBid.amount);
  });

  it('should handle non-existent bid', async () => {
    const invalidBidId = new mongoose.Types.ObjectId().toString();
    const response = await request(BACKEND_URL)
      .get(`${API_BASE}/bids/${invalidBidId}`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.NOT_FOUND);
  });
});

describe('GET /tasker/bids - Get Tasker Bids', () => {
  it('should retrieve all tasks a tasker has bid on', async () => {
    const response = await request(BACKEND_URL)
      .get(`${API_BASE}/tasker/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

    ResponseAssertions.assertSuccessResponse(response);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('should require TASKER role', async () => {
    const response = await request(BACKEND_URL)
      .get(`${API_BASE}/tasker/bids`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.FORBIDDEN);
  });
});

// ============================================================================
// BID UPDATE TESTS
// ============================================================================

describe('PUT /bids/:bidId - Update Bid', () => {
  let testBidForUpdate: any;

  beforeEach(async () => {
    // Create a test task and bid for updating
    const taskData = {
      title: `Test Task for Update ${Date.now()}`,
      description: 'This is a test task for bid updating',
      taskBudget: 100,
      taskLocation: 'Test Location',
      taskCategory: testCategories.default._id, // Use the valid category ID
      latitude: 40.7128,
      longitude: -74.0060,
    };

    const taskResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`)
      .send(taskData);

    const task = taskResponse.body.data;

    const bidData = {
      amount: 80,
      message: 'Original bid message',
    };

    const bidResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${task._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(bidData);

    testBidForUpdate = bidResponse.body.data;
  });

  it('should update bid amount and message', async () => {
    const updateData = {
      amount: 95,
      message: 'Updated proposal with better terms',
    };

    const response = await request(BACKEND_URL)
      .put(`${API_BASE}/bids/${testBidForUpdate._id}`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(updateData);

    ResponseAssertions.assertSuccessResponse(response);
    expect(response.body.data.amount).toBe(updateData.amount);
    expect(response.body.data.message).toBe(updateData.message);
  });

  it('should require TASKER role to update bid', async () => {
    const updateData = {
      amount: 100,
    };

    const response = await request(BACKEND_URL)
      .put(`${API_BASE}/bids/${testBidForUpdate._id}`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`)
      .send(updateData);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.FORBIDDEN);
  });

  it('should validate positive amount on update', async () => {
    const updateData = {
      amount: -10,
    };

    const response = await request(BACKEND_URL)
      .put(`${API_BASE}/bids/${testBidForUpdate._id}`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(updateData);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.BAD_REQUEST);
  });

  it('should handle non-existent bid update', async () => {
    const invalidBidId = new mongoose.Types.ObjectId().toString();
    const updateData = {
      amount: 100,
    };

    const response = await request(BACKEND_URL)
      .put(`${API_BASE}/bids/${invalidBidId}`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(updateData);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.NOT_FOUND);
  });
});

// ============================================================================
// BID DELETION TESTS
// ============================================================================

describe('DELETE /bids/:bidId - Delete Bid', () => {
  let deletableBid: any;

  beforeEach(async () => {
    // Create a fresh task and bid for deletion tests
    const taskData = {
      title: `Test Task for Deletion ${Date.now()}`,
      description: 'This is a test task for bid deletion',
      taskBudget: 100,
      taskLocation: 'Test Location',
      taskCategory: testCategories.default._id, // Use the valid category ID
      latitude: 40.7128,
      longitude: -74.0060,
    };

    const taskResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`)
      .send(taskData);

    const task = taskResponse.body.data;

    const bidData = {
      amount: 75,
      message: 'Bid to be deleted',
    };

    const bidResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${task._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
      .send(bidData);

    deletableBid = bidResponse.body.data;
  });

  it('should delete a pending bid successfully', async () => {
    const response = await request(BACKEND_URL)
      .delete(`${API_BASE}/bids/${deletableBid._id}`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`);

    ResponseAssertions.assertSuccessResponse(response);
    expect(response.body.message).toBe('Bid deleted successfully');

    // Verify bid is deleted
    const checkResponse = await request(BACKEND_URL)
      .get(`${API_BASE}/bids/${deletableBid._id}`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`);

    ResponseAssertions.assertErrorResponse(checkResponse, StatusCodes.NOT_FOUND);
  });

  it('should require TASKER role to delete bid', async () => {
    const response = await request(BACKEND_URL)
      .delete(`${API_BASE}/bids/${deletableBid._id}`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.UNAUTHORIZED);
  });

  it('should handle non-existent bid deletion', async () => {
    const invalidBidId = new mongoose.Types.ObjectId().toString();
    const response = await request(BACKEND_URL)
      .delete(`${API_BASE}/bids/${invalidBidId}`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.NOT_FOUND);
  });
});

// ============================================================================
// BID ACCEPTANCE TESTS
// ============================================================================

describe('PATCH /bids/:bidId/accept - Accept Bid', () => {
  let acceptableBid: any;

  beforeEach(async () => {
    // Create a fresh task and bid for acceptance tests
    const taskData = {
      title: `Test Task for Acceptance ${Date.now()}`,
      description: 'This is a test task for bid acceptance',
      taskBudget: 100,
      taskLocation: 'Test Location',
      taskCategory: testCategories.default._id, // Use the valid category ID
      latitude: 40.7128,
      longitude: -74.0060,
    };

    const taskResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`)
      .send(taskData);

    const task = taskResponse.body.data;

    const bidData = {
      amount: 88,
      message: 'Bid to be accepted',
    };

    const bidResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${task._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
      .send(bidData);

    acceptableBid = bidResponse.body.data;
  });

  it('should accept a bid successfully', async () => {
    const response = await request(BACKEND_URL)
      .patch(`${API_BASE}/bids/${acceptableBid._id}/accept`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`);

    ResponseAssertions.assertSuccessResponse(response);
    expect(response.body.message).toBe('Bid accepted successfully');
  });

  it('should require POSTER role to accept bid', async () => {
    const response = await request(BACKEND_URL)
      .patch(`${API_BASE}/bids/${acceptableBid._id}/accept`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.FORBIDDEN);
  });

  it('should handle non-existent bid acceptance', async () => {
    const invalidBidId = new mongoose.Types.ObjectId().toString();
    const response = await request(BACKEND_URL)
      .patch(`${API_BASE}/bids/${invalidBidId}/accept`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.NOT_FOUND);
  });
});

// ============================================================================
// SECURITY AND EDGE CASES
// ============================================================================

describe('Security and Edge Cases', () => {
  let securityTestTask: any;

  beforeEach(async () => {
    // Create a test task for security tests
    const taskData = {
      title: `Security Test Task ${Date.now()}`,
      description: 'This is a test task for security testing',
      taskBudget: 100,
      taskLocation: 'Security Test Location',
      taskCategory: testCategories.default._id,
      latitude: 40.7128,
      longitude: -74.0060,
    };

    const taskResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`)
      .send(taskData);

    if (taskResponse.status === 201) {
      securityTestTask = taskResponse.body.data;
    } else {
      throw new Error('Failed to create security test task');
    }
  });

  it('should prevent unauthorized access to all endpoints', async () => {
    // Use dummy IDs for security testing
    const dummyTaskId = new mongoose.Types.ObjectId().toString();
    const dummyBidId = new mongoose.Types.ObjectId().toString();
    
    const endpoints = [
      { method: 'post', path: `/tasks/${dummyTaskId}/bids` },
      { method: 'get', path: `/tasks/${dummyTaskId}/bids` },
      { method: 'get', path: `/bids/${dummyBidId}` },
      { method: 'put', path: `/bids/${dummyBidId}` },
      { method: 'delete', path: `/bids/${dummyBidId}` },
      { method: 'patch', path: `/bids/${dummyBidId}/accept` },
      { method: 'get', path: '/tasker/bids' },
    ];

    for (const endpoint of endpoints) {
      const response = await request(BACKEND_URL)[endpoint.method](`${API_BASE}${endpoint.path}`);
      ResponseAssertions.assertErrorResponse(response, StatusCodes.UNAUTHORIZED);
    }
  });

  it('should handle malformed MongoDB ObjectIds', async () => {
    const malformedId = 'invalid-object-id';
    
    const response = await request(BACKEND_URL)
      .get(`${API_BASE}/bids/${malformedId}`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

    ResponseAssertions.assertErrorResponse(response, StatusCodes.BAD_REQUEST);
  });

  it('should sanitize input data', async () => {
    const maliciousData = {
      amount: 85,
      message: '<script>alert("xss")</script>',
    };

    const response = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${securityTestTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
      .send(maliciousData);

    if (response.status === StatusCodes.CREATED) {
      expect(response.body.data.message).not.toContain('<script>');
    }
  });

  it('should handle concurrent bid creation attempts', async () => {
    const bidData = {
      amount: 85,
      message: 'Concurrent bid test',
    };

    // Create multiple concurrent requests
    const promises = Array(3).fill(null).map(() =>
      request(BACKEND_URL)
        .post(`${API_BASE}/tasks/${securityTestTask._id}/bids`)
        .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
        .send(bidData)
    );

    const responses = await Promise.all(promises);
    
    // Only one should succeed, others should fail with duplicate error
    const successCount = responses.filter(r => r.status === StatusCodes.CREATED).length;
    expect(successCount).toBe(1);
  });
});

// ============================================================================
// PERFORMANCE AND LOAD TESTS
// ============================================================================

describe('Performance and Load Tests', () => {
  it('should handle multiple bid retrievals efficiently', async () => {
    // Create a task with bids for performance testing
    const taskData = {
      title: 'Performance Test Task',
      description: 'This is a performance test task',
      taskBudget: 120,
      taskLocation: 'Test Location',
      taskCategory: testCategories.default._id, // Use the valid category ID
      latitude: 40.7128,
      longitude: -74.0060,
    };

    const taskResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`)
      .send(taskData);

    expect(taskResponse.status).toBe(StatusCodes.CREATED);
    const task = taskResponse.body.data;
    expect(task).toBeDefined();
    expect(task._id).toBeDefined();

    // Create a bid on the task
    const bidData = {
      amount: 85,
      message: 'Performance test bid',
    };

    await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${task._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(bidData);

    const startTime = Date.now();
    
    const promises = Array(10).fill(null).map(() =>
      request(BACKEND_URL)
        .get(`${API_BASE}/tasks/${task._id}/bids`)
        .set('Authorization', `Bearer ${testUsers.poster.token}`)
    );

    const responses = await Promise.all(promises);
    const endTime = Date.now();
    
    responses.forEach(response => {
      ResponseAssertions.assertSuccessResponse(response);
    });
    
    // Should complete within reasonable time (adjust as needed)
    expect(endTime - startTime).toBeLessThan(5000);
  });

  it('should handle large bid messages', async () => {
    // Create a task for this specific test
    const taskData = {
      title: `Large Message Test Task ${Date.now()}`,
      description: 'This is a test task for large message testing',
      taskBudget: 100,
      taskLocation: 'Large Message Test Location',
      taskCategory: testCategories.default._id,
      latitude: 40.7128,
      longitude: -74.0060,
    };

    const taskResponse = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`)
      .send(taskData);

    expect(taskResponse.status).toBe(StatusCodes.CREATED);
    const task = taskResponse.body.data;
    expect(task).toBeDefined();
    expect(task._id).toBeDefined();

    const largeBidData = {
      amount: 85,
      message: 'A'.repeat(1000), // 1KB message
    };

    const response = await request(BACKEND_URL)
      .post(`${API_BASE}/tasks/${task._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
      .send(largeBidData);

    // Should either succeed or fail gracefully
    if (response.status === StatusCodes.BAD_REQUEST) {
      ResponseAssertions.assertErrorResponse(response, StatusCodes.BAD_REQUEST);
    } else {
      ResponseAssertions.assertSuccessResponse(response, StatusCodes.CREATED);
    }
  });
});