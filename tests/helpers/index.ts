// Export all authentication helpers
export * from './auth.helper';

// Export all new reusable test helpers
export * from './database.helper';
export * from './test-data.helper';
export * from './mock.helper';
export * from './assertion.helper';
export * from './integration-test.helper';

// Re-export StatusCodes from http-status-codes for convenience
export { StatusCodes } from 'http-status-codes';

// Common test timeouts
export const TEST_TIMEOUTS = {
  DATABASE_SETUP: 30000,
  DATABASE_TEARDOWN: 30000,
  DEFAULT_TEST: 10000,
  LONG_RUNNING_TEST: 60000,
} as const;

// Legacy response assertion helpers (kept for backward compatibility)
// Use ResponseAssertions from assertion.helper.ts for new tests
export const assertSuccessResponse = (response: any, expectedStatus: number = 200): void => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(true);
};

export const assertErrorResponse = (response: any, expectedStatus: number): void => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(false);
};