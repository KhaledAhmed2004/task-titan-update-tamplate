/**
 * Test Fixtures Index
 * 
 * Central export point for all test fixtures.
 * Import fixtures from here to maintain consistency across tests.
 */

// Test Data Fixtures
export * from './test-data.fixtures';

// Mock Data Fixtures  
export * from './mock-data.fixtures';

// Re-export commonly used fixture collections for convenience
export {
  TestUserFixtures,
  TestCategoryFixtures,
  TestTaskFixtures,
  TestBidFixtures,
  TestAuthFixtures,
  TestApiResponseFixtures,
  TestPerformanceFixtures,
} from './test-data.fixtures';

export {
  MockUserFixtures,
  MockCategoryFixtures,
  MockTaskFixtures,
  MockBidFixtures,
  MockResetTokenFixtures,
  MockTokenFixtures,
  MockResponseFixtures,
  MockQueryFixtures,
  MockFileFixtures,
  MockEmailFixtures,
  MockErrorFixtures,
  MockExternalServiceFixtures,
} from './mock-data.fixtures';