import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../../src/app/modules/user/user.model';
import { TaskModel } from '../../src/app/modules/task/task.model';
import { BidModel } from '../../src/app/modules/bid/bid.model';
import { Category } from '../../src/app/modules/category/category.model';
import { ResetToken } from '../../src/app/modules/resetToken/resetToken.model';
import { IUser } from '../../src/app/modules/user/user.interface';
import { Task, TaskStatus } from '../../src/app/modules/task/task.interface';
import { Bid, BidStatus } from '../../src/app/modules/bid/bid.interface';
import { ICategory } from '../../src/app/modules/category/category.interface';
import { USER_ROLES, USER_STATUS } from '../../src/enums/user';
import config from '../../src/config';

/**
 * Test Data Helper
 * 
 * Provides reusable test data generators and factory functions.
 * Use this to create consistent test data across all test files.
 */

// Counter for unique data generation
let dataCounter = 0;
const getUniqueId = () => ++dataCounter;

/**
 * User Data Generators
 */
export const TestUserFactory = {
  /**
   * Generate basic user data
   */
  generateUserData(overrides: Partial<IUser> = {}): Partial<IUser> {
    const id = getUniqueId();
    return {
      name: `Test User ${id}`,
      email: `testuser${id}@example.com`,
      password: 'password123',
      role: USER_ROLES.POSTER,
      location: `Test City ${id}`,
      phone: `+123456789${id}`,
      status: USER_STATUS.ACTIVE,
      verified: true,
      ...overrides,
    };
  },

  /**
   * Generate poster user data
   */
  generatePosterData(overrides: Partial<IUser> = {}): Partial<IUser> {
    return this.generateUserData({
      role: USER_ROLES.POSTER,
      name: `Test Poster ${getUniqueId()}`,
      ...overrides,
    });
  },

  /**
   * Generate tasker user data
   */
  generateTaskerData(overrides: Partial<IUser> = {}): Partial<IUser> {
    return this.generateUserData({
      role: USER_ROLES.TASKER,
      name: `Test Tasker ${getUniqueId()}`,
      ...overrides,
    });
  },

  /**
   * Generate admin user data
   */
  generateAdminData(overrides: Partial<IUser> = {}): Partial<IUser> {
    return this.generateUserData({
      role: USER_ROLES.ADMIN,
      name: `Test Admin ${getUniqueId()}`,
      ...overrides,
    });
  },

  /**
   * Create user with hashed password
   */
  async createUser(userData: Partial<IUser> = {}): Promise<any> {
    const data = this.generateUserData(userData);
    const hashedPassword = await bcrypt.hash(data.password as string, Number(config.bcrypt_salt_rounds));
    
    return await User.create({
      ...data,
      password: hashedPassword,
    });
  },

  /**
   * Create verified user
   */
  async createVerifiedUser(userData: Partial<IUser> = {}): Promise<any> {
    return this.createUser({
      verified: true,
      status: USER_STATUS.ACTIVE,
      ...userData,
    });
  },

  /**
   * Create unverified user with OTP
   */
  async createUnverifiedUser(userData: Partial<IUser> = {}): Promise<any> {
    return this.createUser({
      verified: false,
      status: USER_STATUS.ACTIVE,
      authentication: {
        isResetPassword: false,
        oneTimeCode: 123456,
        expireAt: new Date(Date.now() + 5 * 60000), // 5 minutes from now
      },
      ...userData,
    });
  },

  /**
   * Create multiple users
   */
  async createMultipleUsers(count: number, userData: Partial<IUser> = {}): Promise<any[]> {
    const users = [];
    for (let i = 0; i < count; i++) {
      const user = await this.createUser({
        ...userData,
        email: `testuser${getUniqueId()}@example.com`,
      });
      users.push(user);
    }
    return users;
  },
};

/**
 * Category Data Generators
 */
export const TestCategoryFactory = {
  /**
   * Generate category data
   */
  generateCategoryData(overrides: Partial<ICategory> = {}): Partial<ICategory> {
    const id = getUniqueId();
    return {
      name: `Test Category ${id}`,
      description: `Test category description ${id}`,
      icon: `test-icon-${id}`,
      ...overrides,
    };
  },

  /**
   * Create category
   */
  async createCategory(categoryData: Partial<ICategory> = {}): Promise<any> {
    const data = this.generateCategoryData(categoryData);
    return await Category.create(data);
  },

  /**
   * Create multiple categories
   */
  async createMultipleCategories(count: number): Promise<any[]> {
    const categories = [];
    for (let i = 0; i < count; i++) {
      const category = await this.createCategory();
      categories.push(category);
    }
    return categories;
  },
};

/**
 * Task Data Generators
 */
export const TestTaskFactory = {
  /**
   * Generate task data
   */
  generateTaskData(userId: string, categoryId: string, overrides: Partial<Task> = {}): Partial<Task> {
    const id = getUniqueId();
    return {
      title: `Test Task ${id}`,
      description: `Test task description ${id}`,
      taskBudget: 100,
      taskLocation: `Test Location ${id}`,
      userId: new mongoose.Types.ObjectId(userId),
      taskCategory: new mongoose.Types.ObjectId(categoryId),
      latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
      status: TaskStatus.OPEN,
      isDeleted: false,
      ...overrides,
    };
  },

  /**
   * Create task
   */
  async createTask(userId: string, categoryId: string, taskData: Partial<Task> = {}): Promise<any> {
    const data = this.generateTaskData(userId, categoryId, taskData);
    return await TaskModel.create(data);
  },

  /**
   * Create multiple tasks
   */
  async createMultipleTasks(userId: string, categoryId: string, count: number): Promise<any[]> {
    const tasks = [];
    for (let i = 0; i < count; i++) {
      const task = await this.createTask(userId, categoryId);
      tasks.push(task);
    }
    return tasks;
  },
};

/**
 * Bid Data Generators
 */
export const TestBidFactory = {
  /**
   * Generate bid data
   */
  generateBidData(taskId: string, taskerId: string, overrides: Partial<Bid> = {}): Partial<Bid> {
    const id = getUniqueId();
    return {
      taskId: new mongoose.Types.ObjectId(taskId),
      taskerId: new mongoose.Types.ObjectId(taskerId),
      amount: 80 + Math.floor(Math.random() * 40), // Random amount between 80-120
      message: `Test bid message ${id}`,
      status: BidStatus.PENDING,
      ...overrides,
    };
  },

  /**
   * Create bid
   */
  async createBid(taskId: string, taskerId: string, bidData: Partial<Bid> = {}): Promise<any> {
    const data = this.generateBidData(taskId, taskerId, bidData);
    return await BidModel.create(data);
  },

  /**
   * Create multiple bids
   */
  async createMultipleBids(taskId: string, taskerIds: string[], bidData: Partial<Bid> = {}): Promise<any[]> {
    const bids = [];
    for (const taskerId of taskerIds) {
      const bid = await this.createBid(taskId, taskerId, bidData);
      bids.push(bid);
    }
    return bids;
  },
};

/**
 * Reset Token Data Generators
 */
export const TestResetTokenFactory = {
  /**
   * Create reset token
   */
  async createResetToken(userId: string): Promise<any> {
    return await ResetToken.create({
      userId: new mongoose.Types.ObjectId(userId),
      token: `reset-token-${getUniqueId()}`,
      expireAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    });
  },
};

/**
 * Complete Test Environment Setup
 */
export const TestEnvironmentFactory = {
  /**
   * Setup complete test environment with users, categories, tasks, and bids
   */
  async setupCompleteEnvironment() {
    // Create users
    const poster = await TestUserFactory.createVerifiedUser({ role: USER_ROLES.POSTER });
    const tasker1 = await TestUserFactory.createVerifiedUser({ role: USER_ROLES.TASKER });
    const tasker2 = await TestUserFactory.createVerifiedUser({ role: USER_ROLES.TASKER });
    const admin = await TestUserFactory.createVerifiedUser({ role: USER_ROLES.ADMIN });

    // Create category
    const category = await TestCategoryFactory.createCategory();

    // Create tasks
    const task1 = await TestTaskFactory.createTask(poster._id.toString(), category._id.toString());
    const task2 = await TestTaskFactory.createTask(poster._id.toString(), category._id.toString());

    // Create bids
    const bid1 = await TestBidFactory.createBid(task1._id.toString(), tasker1._id.toString());
    const bid2 = await TestBidFactory.createBid(task1._id.toString(), tasker2._id.toString());

    return {
      users: { poster, tasker1, tasker2, admin },
      category,
      tasks: { task1, task2 },
      bids: { bid1, bid2 },
    };
  },

  /**
   * Setup basic environment with just users and category
   */
  async setupBasicEnvironment() {
    const poster = await TestUserFactory.createVerifiedUser({ role: USER_ROLES.POSTER });
    const tasker = await TestUserFactory.createVerifiedUser({ role: USER_ROLES.TASKER });
    const category = await TestCategoryFactory.createCategory();

    return { poster, tasker, category };
  },
};

/**
 * Utility functions
 */
export const TestDataUtils = {
  /**
   * Generate random OTP
   */
  generateOTP(): number {
    return Math.floor(100000 + Math.random() * 900000);
  },

  /**
   * Generate random email
   */
  generateRandomEmail(): string {
    return `test${getUniqueId()}${Date.now()}@example.com`;
  },

  /**
   * Generate random phone
   */
  generateRandomPhone(): string {
    return `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  },

  /**
   * Wait for specified milliseconds
   */
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};