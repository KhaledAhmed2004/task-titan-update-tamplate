import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { setupTestDatabase } from './database.helper';
import { TestEnvironmentFactory, TestUserFactory, TestCategoryFactory } from './test-data.helper';
import { authenticateExistingTestUser, type AuthenticatedUser } from './auth.helper';

/**
 * Integration Test Helper
 * 
 * Provides specialized utilities for integration tests that need
 * database setup, user authentication, and common test data.
 */

export interface IntegrationTestEnvironment {
  users: {
    poster: any;
    tasker1: any;
    tasker2: any;
    admin?: any;
  };
  authenticatedUsers: {
    poster: AuthenticatedUser;
    tasker1: AuthenticatedUser;
    tasker2: AuthenticatedUser;
    admin?: AuthenticatedUser;
  };
  category: any;
  tasks?: any[];
  bids?: any[];
}

/**
 * Integration Test Setup Helper
 */
export class IntegrationTestSetup {
  private static environment: IntegrationTestEnvironment | null = null;

  /**
   * Setup complete integration test environment
   * This includes database, users, authentication, and basic test data
   */
  static async setupCompleteEnvironment(): Promise<IntegrationTestEnvironment> {
    if (this.environment) {
      return this.environment;
    }

    console.log('🚀 Setting up complete integration test environment...');

    // Setup basic test data
    const basicEnv = await TestEnvironmentFactory.setupBasicEnvironment();
    
    // Try to authenticate with real backend users first
    const authenticatedUsers: any = {};
    const realBackendUsers = [
      { key: 'poster', email: 'poster@test.com' },
      { key: 'tasker1', email: 'tasker1@test.com' },
      { key: 'tasker2', email: 'tasker2@test.com' },
    ];

    for (const { key, email } of realBackendUsers) {
      try {
        const user = await authenticateExistingTestUser(email);
        authenticatedUsers[key] = user;
        console.log(`✅ ${key} authenticated with real backend`);
      } catch (error) {
        console.log(`⚠️ ${key} authentication failed, using test database user`);
        // Fallback to test database user (already created in basicEnv)
        authenticatedUsers[key] = {
          _id: basicEnv[key]._id.toString(),
          email: basicEnv[key].email,
          name: basicEnv[key].name,
          role: basicEnv[key].role,
          token: 'mock-token-for-test-db',
          user: basicEnv[key],
        };
      }
    }

    this.environment = {
      users: {
        poster: basicEnv.poster,
        tasker1: basicEnv.tasker,
        tasker2: await TestUserFactory.createVerifiedUser({ role: 'TASKER' }),
      },
      authenticatedUsers,
      category: basicEnv.category,
    };

    console.log('✅ Integration test environment setup complete');
    return this.environment;
  }

  /**
   * Setup minimal integration test environment
   * Just database and basic users
   */
  static async setupMinimalEnvironment() {
    return await TestEnvironmentFactory.setupBasicEnvironment();
  }

  /**
   * Clear the cached environment
   */
  static clearEnvironment(): void {
    this.environment = null;
  }

  /**
   * Get current environment (must be setup first)
   */
  static getCurrentEnvironment(): IntegrationTestEnvironment | null {
    return this.environment;
  }
}

/**
 * Common integration test hooks
 */
export const useIntegrationTestSetup = (options: {
  setupDatabase?: boolean;
  setupEnvironment?: boolean;
  clearBetweenTests?: boolean;
} = {}) => {
  const {
    setupDatabase = true,
    setupEnvironment = false,
    clearBetweenTests = true,
  } = options;

  if (setupDatabase) {
    setupTestDatabase();
  }

  let testEnvironment: IntegrationTestEnvironment | null = null;

  beforeAll(async () => {
    if (setupEnvironment) {
      testEnvironment = await IntegrationTestSetup.setupCompleteEnvironment();
    }
  }, 60000); // Longer timeout for environment setup

  afterAll(async () => {
    if (setupEnvironment) {
      IntegrationTestSetup.clearEnvironment();
    }
  });

  beforeEach(async () => {
    if (clearBetweenTests && !setupEnvironment) {
      // Only clear if we're not using persistent environment
      // The database helper will handle clearing collections
    }
  });

  return {
    getEnvironment: () => testEnvironment || IntegrationTestSetup.getCurrentEnvironment(),
  };
};

/**
 * Specialized setup for different types of integration tests
 */
export const IntegrationTestPatterns = {
  /**
   * Setup for API endpoint testing
   */
  setupApiTest() {
    return useIntegrationTestSetup({
      setupDatabase: true,
      setupEnvironment: true,
      clearBetweenTests: true,
    });
  },

  /**
   * Setup for database integration testing
   */
  setupDatabaseTest() {
    return useIntegrationTestSetup({
      setupDatabase: true,
      setupEnvironment: false,
      clearBetweenTests: true,
    });
  },

  /**
   * Setup for service integration testing
   */
  setupServiceTest() {
    return useIntegrationTestSetup({
      setupDatabase: true,
      setupEnvironment: false,
      clearBetweenTests: true,
    });
  },

  /**
   * Setup for end-to-end testing
   */
  setupE2ETest() {
    return useIntegrationTestSetup({
      setupDatabase: false, // E2E tests might use real backend
      setupEnvironment: true,
      clearBetweenTests: false, // E2E tests might need persistent state
    });
  },
};

/**
 * Common test data patterns for integration tests
 */
export const IntegrationTestData = {
  /**
   * Create test scenario: User posts task, multiple taskers bid
   */
  async createBiddingScenario() {
    const env = await IntegrationTestSetup.setupCompleteEnvironment();
    
    // This would be implemented based on your specific needs
    // For now, return the basic environment
    return env;
  },

  /**
   * Create test scenario: Task with accepted bid
   */
  async createAcceptedBidScenario() {
    const env = await IntegrationTestSetup.setupCompleteEnvironment();
    
    // Implementation would create task, bids, and accept one
    return env;
  },

  /**
   * Create test scenario: Multiple tasks and bids
   */
  async createComplexScenario() {
    const env = await IntegrationTestSetup.setupCompleteEnvironment();
    
    // Implementation would create multiple tasks, categories, users, bids
    return env;
  },
};