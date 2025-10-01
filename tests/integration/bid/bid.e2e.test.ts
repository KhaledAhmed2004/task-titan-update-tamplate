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
import { MongoMemoryServer } from 'mongodb-memory-server';
import { StatusCodes } from 'http-status-codes';
import {
  authenticateExistingTestUser,
  TEST_TIMEOUTS,
  assertSuccessResponse,
  assertErrorResponse,
  makeAuthenticatedRequest,
  BACKEND_URL,
  API_BASE,
  TEST_USERS,
  type AuthenticatedUser
} from '../../helpers';

import { User } from '../../../src/app/modules/user/user.model';
import { TaskModel } from '../../../src/app/modules/task/task.model';
import { BidModel } from '../../../src/app/modules/bid/bid.model';
import { Category } from '../../../src/app/modules/category/category.model';
import { USER_ROLES, USER_STATUS } from '../../../src/enums/user';

// Global test state
let mongoServer: MongoMemoryServer;
let testUsers: Record<string, AuthenticatedUser> = {};
let testCategories: Record<string, any> = {};
let globalTestTask: any = null; // Global task for all tests

/**
 * End-to-End Bid Testing Suite
 * 
 * This test suite follows a complete workflow:
 * 1. Setup authenticated users (poster, taskers)
 * 2. Setup categories from backend
 * 3. Create a global test task
 * 4. Test all bid operations on this task
 * 5. Clean up resources
 */

const setupCompleteTestEnvironment = async (): Promise<void> => {
  try {
    console.log('🚀 Setting up complete E2E test environment...');

    // Step 1: Authenticate test users
    console.log('👥 Authenticating test users...');
    const userCredentials = [
      { key: 'poster', email: 'poster@test.com' },
      { key: 'tasker1', email: 'tasker1@test.com' },
      { key: 'tasker2', email: 'tasker2@test.com' },
      { key: 'tasker3', email: 'tasker3@test.com' }
    ];
    
    for (const { key, email } of userCredentials) {
      try {
        console.log(`🔐 Attempting to authenticate ${email}...`);
        const user = await authenticateExistingTestUser(email);
        testUsers[key] = user;
        console.log(`✅ ${key} authenticated: ${user.user.email}`);
      } catch (authError) {
        console.log(`⚠️ ${email} authentication failed:`, authError);
        console.log(`⚠️ Skipping user creation as users should already exist`);
        // For now, we'll skip this user and continue
      }
    }

    // Verify we have at least some users to work with
    if (Object.keys(testUsers).length === 0) {
      throw new Error('No test users could be set up. Please check your backend authentication.');
    }

    // Step 2: Setup categories
    console.log('📂 Setting up categories...');
    try {
      const response = await request(BACKEND_URL)
        .get(`${API_BASE}/categories`)
        .set('Authorization', `Bearer ${testUsers.poster.token}`);

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

    // Step 3: Create a global test task
    console.log('📋 Creating global test task...');
    await createGlobalTestTask();

    console.log('✅ Complete E2E test environment setup completed');
    console.log('📊 Available test users:', Object.keys(testUsers));
    console.log('📋 Global test task ID:', globalTestTask?._id);

  } catch (error) {
    console.error('❌ E2E test environment setup failed:', error);
    throw error;
  }
};

const createGlobalTestTask = async (): Promise<void> => {
  console.log('📝 Creating global test task...');
  
  const taskData = {
    title: `E2E Test Task ${Date.now()}`,
    description: 'This is a comprehensive test task for end-to-end bid testing',
    taskBudget: 150,
    taskLocation: 'E2E Test Location',
    taskCategory: testCategories.default._id,
    latitude: 40.7128,
    longitude: -74.0060,
  };

  const taskResponse = await request(BACKEND_URL)
    .post(`${API_BASE}/tasks`)
    .set('Authorization', `Bearer ${testUsers.poster.token}`)
    .send(taskData);

  if (taskResponse.status === StatusCodes.CREATED && taskResponse.body.success) {
    globalTestTask = taskResponse.body.data;
    console.log(`✅ Global test task created: ${globalTestTask.title} (${globalTestTask._id})`);
  } else {
    console.error('❌ Failed to create global test task:', {
      status: taskResponse.status,
      body: taskResponse.body,
      taskData,
      posterToken: testUsers.poster ? 'exists' : 'missing',
      categoryId: testCategories.default ? testCategories.default._id : 'missing'
    });
    throw new Error(`Failed to create global test task: ${taskResponse.status} - ${JSON.stringify(taskResponse.body)}`);
  }
};

const cleanupCompleteTestEnvironment = async (): Promise<void> => {
  try {
    console.log('🧹 Cleaning up E2E test environment...');
    
    // Clean up database collections
    await Promise.all([
      User.deleteMany({}),
      TaskModel.deleteMany({}),
      BidModel.deleteMany({}),
      Category.deleteMany({}),
    ]);
    
    // Reset global state
    testUsers = {};
    testCategories = {};
    globalTestTask = null;
    
    console.log('✅ E2E test environment cleanup completed');
  } catch (error) {
    console.error('❌ E2E test environment cleanup failed:', error);
  }
};

// Test Suite Setup
beforeAll(async () => {
  // Only connect if not already connected
  if (mongoose.connection.readyState === 0) {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  }

  await setupCompleteTestEnvironment();
}, TEST_TIMEOUTS.DATABASE_SETUP);

afterAll(async () => {
  await cleanupCompleteTestEnvironment();
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, TEST_TIMEOUTS.DATABASE_TEARDOWN);

beforeEach(async () => {
  // Clean up bids before each test to ensure clean state
  await BidModel.deleteMany({});
});

afterEach(async () => {
  // Optional: Additional cleanup after each test
});

// End-to-End Test Scenarios
describe('End-to-End Bid Workflow', () => {
  
  describe('Complete Bid Creation Flow', () => {
    it('should complete the full bid creation workflow', async () => {
      // Verify global test task exists
      expect(globalTestTask).toBeDefined();
      expect(globalTestTask._id).toBeDefined();

      // Step 1: Create a bid
      const bidData = { body: {
        amount: 120,
        message: 'I am experienced in this type of work and can deliver high quality results',
      }};

      const createResponse = await request(BACKEND_URL)
        .post(`${API_BASE}/tasks/${globalTestTask._id}/bids`)
        .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
        .send(bidData);

      assertSuccessResponse(createResponse, StatusCodes.CREATED);
      expect(createResponse.body.data.amount).toBe(bidData.body.amount);
      expect(createResponse.body.data.message).toBe(bidData.body.message);
      expect(createResponse.body.data.taskId).toBe(globalTestTask._id);

      const bidId = createResponse.body.data._id;

      // Step 2: Verify bid appears in task's bid list
      const getBidsResponse = await request(BACKEND_URL)
        .get(`${API_BASE}/tasks/${globalTestTask._id}/bids`)
        .set('Authorization', `Bearer ${testUsers.poster.token}`);

      assertSuccessResponse(getBidsResponse);
      expect(getBidsResponse.body.data.length).toBe(1);
      expect(getBidsResponse.body.data[0]._id).toBe(bidId);

      // Step 3: Get specific bid by ID
      const getBidResponse = await request(BACKEND_URL)
        .get(`${API_BASE}/bids/${bidId}`)
        .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

      assertSuccessResponse(getBidResponse);
      expect(getBidResponse.body.data._id).toBe(bidId);

      // Step 4: Update the bid
      const updateData = {
        amount: 110,
        message: 'Updated bid with better pricing',
      };

      const updateResponse = await request(BACKEND_URL)
        .put(`${API_BASE}/bids/${bidId}`)
        .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
        .send(updateData);

      assertSuccessResponse(updateResponse);
      expect(updateResponse.body.data.amount).toBe(updateData.amount);
      expect(updateResponse.body.data.message).toBe(updateData.message);

      console.log('✅ Complete bid creation workflow test passed');
    });

    it('should handle multiple bids on the same task', async () => {
      // Create multiple bids from different taskers
      const bidData1 = { body: { amount: 100, message: 'First bid from tasker1' } };
      const bidData2 = { body: { amount: 95, message: 'Competitive bid from tasker2' } };
      const bidData3 = { body: { amount: 105, message: 'Quality bid from tasker3' } };

      const responses = await Promise.all([
        request(BACKEND_URL)
          .post(`${API_BASE}/tasks/${globalTestTask._id}/bids`)
          .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
          .send(bidData1),
        request(BACKEND_URL)
          .post(`${API_BASE}/tasks/${globalTestTask._id}/bids`)
          .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
          .send(bidData2),
        request(BACKEND_URL)
          .post(`${API_BASE}/tasks/${globalTestTask._id}/bids`)
          .set('Authorization', `Bearer ${testUsers.tasker3.token}`)
          .send(bidData3),
      ]);

      // Verify all bids were created successfully
      responses.forEach(response => {
        assertSuccessResponse(response, StatusCodes.CREATED);
      });

      // Verify all bids appear in the task's bid list
      const getBidsResponse = await request(BACKEND_URL)
        .get(`${API_BASE}/tasks/${globalTestTask._id}/bids`)
        .set('Authorization', `Bearer ${testUsers.poster.token}`);

      assertSuccessResponse(getBidsResponse);
      expect(getBidsResponse.body.data.length).toBe(3);

      console.log('✅ Multiple bids workflow test passed');
    });
  });

  describe('Bid Management Flow', () => {
    let testBidId: string;

    beforeEach(async () => {
      // Create a test bid for management operations
      const bidData = { body: {
        amount: 130,
        message: 'Test bid for management operations',
      }};

      const response = await request(BACKEND_URL)
        .post(`${API_BASE}/tasks/${globalTestTask._id}/bids`)
        .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
        .send(bidData);

      testBidId = response.body.data._id;
    });

    it('should complete bid acceptance workflow', async () => {
      // Accept the bid
      const acceptResponse = await request(BACKEND_URL)
        .patch(`${API_BASE}/bids/${testBidId}/accept`)
        .set('Authorization', `Bearer ${testUsers.poster.token}`);

      assertSuccessResponse(acceptResponse);
      expect(acceptResponse.body.data.status).toBe('ACCEPTED');

      console.log('✅ Bid acceptance workflow test passed');
    });

    it('should complete bid deletion workflow', async () => {
      // Delete the bid
      const deleteResponse = await request(BACKEND_URL)
        .delete(`${API_BASE}/bids/${testBidId}`)
        .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

      assertSuccessResponse(deleteResponse);

      // Verify bid is deleted
      const getBidResponse = await request(BACKEND_URL)
        .get(`${API_BASE}/bids/${testBidId}`)
        .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

      assertErrorResponse(getBidResponse, StatusCodes.NOT_FOUND);

      console.log('✅ Bid deletion workflow test passed');
    });
  });

  describe('Security and Authorization Flow', () => {
    it('should enforce proper authorization throughout the workflow', async () => {
      // Create a bid
      const bidData = { body: { amount: 140, message: 'Security test bid' } };
      
      const createResponse = await request(BACKEND_URL)
        .post(`${API_BASE}/tasks/${globalTestTask._id}/bids`)
        .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
        .send(bidData);

      console.log('Create Response Status:', createResponse.status);
      console.log('Create Response Body:', JSON.stringify(createResponse.body, null, 2));

      // Check if bid creation was successful before accessing _id
      if (createResponse.status !== 201 || !createResponse.body.data) {
        throw new Error(`Failed to create bid: ${createResponse.status} - ${JSON.stringify(createResponse.body)}`);
      }

      const bidId = createResponse.body.data._id;

      // Test unauthorized access attempts
      const unauthorizedTests = [
        // Tasker2 trying to update tasker1's bid
        request(BACKEND_URL)
          .put(`${API_BASE}/bids/${bidId}`)
          .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
          .send({ amount: 50 }),
        
        // Tasker2 trying to delete tasker1's bid
        request(BACKEND_URL)
          .delete(`${API_BASE}/bids/${bidId}`)
          .set('Authorization', `Bearer ${testUsers.tasker2.token}`),
      ];

      const unauthorizedResponses = await Promise.all(unauthorizedTests);
      
      // All should return unauthorized or forbidden
      unauthorizedResponses.forEach(response => {
        expect([StatusCodes.UNAUTHORIZED, StatusCodes.FORBIDDEN]).toContain(response.status);
      });

      console.log('✅ Security and authorization workflow test passed');
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle invalid data throughout the workflow', async () => {
      // Test invalid bid creation
      const invalidBidData = { body: {
        amount: -50, // Invalid negative amount
        message: '', // Empty message
      }};

      const invalidResponse = await request(BACKEND_URL)
        .post(`${API_BASE}/tasks/${globalTestTask._id}/bids`)
        .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
        .send(invalidBidData);

      assertErrorResponse(invalidResponse, StatusCodes.BAD_REQUEST);

      // Test operations on non-existent bid
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const nonExistentTests = [
        request(BACKEND_URL)
          .get(`${API_BASE}/bids/${fakeId}`)
          .set('Authorization', `Bearer ${testUsers.tasker1.token}`),
        
        request(BACKEND_URL)
          .put(`${API_BASE}/bids/${fakeId}`)
          .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
          .send({ amount: 100 }),
      ];

      const nonExistentResponses = await Promise.all(nonExistentTests);
      
      nonExistentResponses.forEach(response => {
        assertErrorResponse(response, StatusCodes.NOT_FOUND);
      });

      console.log('✅ Error handling workflow test passed');
    });
  });
});