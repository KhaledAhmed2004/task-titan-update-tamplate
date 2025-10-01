import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

/**
 * Database Test Helper
 * 
 * Provides reusable database setup and teardown functionality for tests.
 * Use this instead of duplicating MongoDB setup in each test file.
 */
export class DatabaseTestHelper {
  private static instance: DatabaseTestHelper;
  private mongoServer: MongoMemoryServer | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): DatabaseTestHelper {
    if (!DatabaseTestHelper.instance) {
      DatabaseTestHelper.instance = new DatabaseTestHelper();
    }
    return DatabaseTestHelper.instance;
  }

  /**
   * Setup in-memory MongoDB for testing
   * Call this in beforeAll hook
   */
  async setupDatabase(): Promise<void> {
    if (this.isConnected) return;

    try {
      // Start in-memory MongoDB instance
      this.mongoServer = await MongoMemoryServer.create();
      const mongoUri = this.mongoServer.getUri();
      
      // Connect to the in-memory database
      await mongoose.connect(mongoUri);
      this.isConnected = true;
      
      console.log('🗄️ Test database connected successfully');
    } catch (error) {
      console.error('❌ Failed to setup test database:', error);
      throw error;
    }
  }

  /**
   * Cleanup database connection
   * Call this in afterAll hook
   */
  async teardownDatabase(): Promise<void> {
    if (!this.isConnected) return;

    try {
      // Disconnect from database
      await mongoose.disconnect();
      
      // Stop the in-memory MongoDB instance
      if (this.mongoServer) {
        await this.mongoServer.stop();
        this.mongoServer = null;
      }
      
      this.isConnected = false;
      console.log('🗄️ Test database disconnected successfully');
    } catch (error) {
      console.error('❌ Failed to teardown test database:', error);
      throw error;
    }
  }

  /**
   * Clear all collections
   * Call this in beforeEach hook to ensure clean state
   */
  async clearDatabase(): Promise<void> {
    if (!this.isConnected) return;

    try {
      const collections = mongoose.connection.collections;
      const clearPromises = Object.values(collections).map(collection => 
        collection.deleteMany({})
      );
      await Promise.all(clearPromises);
    } catch (error) {
      console.error('❌ Failed to clear test database:', error);
      throw error;
    }
  }

  /**
   * Get database connection status
   */
  isDbConnected(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get MongoDB URI for manual connections
   */
  getMongoUri(): string | null {
    return this.mongoServer?.getUri() || null;
  }
}

/**
 * Convenience functions for common test setup patterns
 */
export const setupTestDatabase = () => {
  const dbHelper = DatabaseTestHelper.getInstance();
  
  beforeAll(async () => {
    await dbHelper.setupDatabase();
  }, 30000);

  afterAll(async () => {
    await dbHelper.teardownDatabase();
  }, 30000);

  beforeEach(async () => {
    await dbHelper.clearDatabase();
  });
};

/**
 * For tests that need manual database control
 */
export const getTestDatabase = () => DatabaseTestHelper.getInstance();