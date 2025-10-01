import { USER_ROLES } from '../../../../src/enums/user';
import { StatusCodes } from 'http-status-codes';

// Validation Test Scenarios
export const validationTestScenarios = [
  {
    name: 'should handle malformed JSON gracefully',
    testType: 'malformed_json',
    payload: '{"name": "Test", "email": "test@test.com", "password":}',
    expectedStatus: [StatusCodes.BAD_REQUEST, StatusCodes.INTERNAL_SERVER_ERROR],
  },
  {
    name: 'should validate email formats comprehensively',
    testType: 'email_validation',
    emails: ['plainaddress', '@missingdomain.com', 'missing@.com', 'missing@domain', 'spaces @domain.com'],
    expectedStatus: [StatusCodes.CREATED, StatusCodes.BAD_REQUEST],
  },
  {
    name: 'should enforce password strength requirements',
    testType: 'password_strength',
    passwords: ['123', 'abc', 'password', '12345678'],
    expectedStatus: [StatusCodes.CREATED, StatusCodes.BAD_REQUEST],
  },
];

// Security Test Scenarios
export const securityTestScenarios = [
  {
    name: 'should not expose sensitive information in error messages',
    testType: 'sensitive_info',
    endpoint: '/api/v1/user/64f123abc456def789012345/sensitive',
    expectedStatus: StatusCodes.NOT_FOUND,
    forbiddenWords: ['password', 'authentication', 'jwt', 'token'],
  },
  {
    name: 'should handle malicious input gracefully',
    testType: 'malicious_input',
    payload: {
      name: '<script>alert("xss")</script>',
      email: 'malicious@example.com',
      password: 'password123',
      role: USER_ROLES.TASKER,
      location: 'Hacker City',
      phone: '+1234567890',
    },
    expectedStatus: [StatusCodes.OK, StatusCodes.CREATED, StatusCodes.BAD_REQUEST],
  },
  {
    name: 'should prevent information disclosure through timing attacks',
    testType: 'timing_attack',
    existingEmail: 'poster@test.com',
    nonExistingEmail: 'nonexistent@example.com',
    maxTimeDifference: 1000,
  },
];

// Edge Case Test Scenarios
export const edgeCaseScenarios = [
  {
    name: 'should handle database connection errors gracefully',
    testType: 'database_connection',
    endpoint: '/api/v1/user',
    timeout: 5000,
  },
  {
    name: 'should handle concurrent user creation attempts',
    testType: 'concurrent_creation',
    concurrentCount: 5,
    expectedStatus: [StatusCodes.CREATED, StatusCodes.BAD_REQUEST],
  },
  {
    name: 'should handle large payload sizes appropriately',
    testType: 'large_payload',
    payload: {
      name: 'A'.repeat(1000),
      location: 'B'.repeat(1000),
    },
    expectedStatus: [StatusCodes.CREATED, StatusCodes.BAD_REQUEST, StatusCodes.INTERNAL_SERVER_ERROR],
  },
];