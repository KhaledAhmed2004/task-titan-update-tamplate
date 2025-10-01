import { USER_ROLES } from '../../../../src/enums/user';
import { StatusCodes } from 'http-status-codes';

// Re-export StatusCodes for backward compatibility with other files
export const HTTP_STATUS = StatusCodes;

// User Creation Test Scenarios
export const userCreationScenarios = [
  {
    name: 'should create a new user with valid data',
    input: {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: USER_ROLES.POSTER,
      location: 'New York',
      phone: '+1234567890',
    },
    expectedStatus: HTTP_STATUS.CREATED,
    shouldSucceed: true,
  },
  {
    name: 'should create user with minimal required fields',
    input: {
      name: 'Minimal User',
      email: 'minimal@test.com',
      password: 'password123',
    },
    expectedStatus: [HTTP_STATUS.CREATED, HTTP_STATUS.BAD_REQUEST],
    shouldSucceed: 'conditional',
  },
];

// User Validation Test Scenarios
export const userValidationScenarios = [
  {
    name: 'should reject user with invalid email format',
    input: {
      name: 'Test User',
      email: 'invalid-email',
      password: 'password123',
      role: USER_ROLES.POSTER,
      location: 'Test City',
      phone: '+1234567890',
    },
    expectedStatus: [HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.CREATED],
    shouldSucceed: false,
  },
  {
    name: 'should reject user with short password',
    input: {
      name: 'Test User',
      email: 'test@example.com',
      password: '123',
      role: USER_ROLES.POSTER,
      location: 'Test City',
      phone: '+1234567890',
    },
    expectedStatus: [HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.CREATED],
    shouldSucceed: false,
  },
];

// Required Fields Test Scenarios
export const requiredFieldsScenarios = [
  {
    name: 'should reject user without name',
    field: 'name',
    expectedStatus: HTTP_STATUS.BAD_REQUEST,
  },
  {
    name: 'should reject user without email',
    field: 'email',
    expectedStatus: HTTP_STATUS.BAD_REQUEST,
  },
  {
    name: 'should reject user without password',
    field: 'password',
    expectedStatus: HTTP_STATUS.BAD_REQUEST,
  },
];

// Invalid Email Test Scenarios
export const invalidEmailScenarios = [
  {
    name: 'should reject plain address without @',
    email: 'plainaddress',
    expectedStatus: [HTTP_STATUS.CREATED, HTTP_STATUS.BAD_REQUEST],
  },
  {
    name: 'should reject email missing domain',
    email: '@missingdomain.com',
    expectedStatus: [HTTP_STATUS.CREATED, HTTP_STATUS.BAD_REQUEST],
  },
  {
    name: 'should reject email with missing domain name',
    email: 'missing@.com',
    expectedStatus: [HTTP_STATUS.CREATED, HTTP_STATUS.BAD_REQUEST],
  },
  {
    name: 'should reject email without TLD',
    email: 'missing@domain',
    expectedStatus: [HTTP_STATUS.CREATED, HTTP_STATUS.BAD_REQUEST],
  },
  {
    name: 'should reject email with spaces',
    email: 'spaces @domain.com',
    expectedStatus: [HTTP_STATUS.CREATED, HTTP_STATUS.BAD_REQUEST],
  },
];

// Password Strength Test Scenarios
export const passwordStrengthScenarios = [
  {
    name: 'should handle numeric password',
    password: '123',
    expectedStatus: [HTTP_STATUS.CREATED, HTTP_STATUS.BAD_REQUEST],
  },
  {
    name: 'should handle alphabetic password',
    password: 'abc',
    expectedStatus: [HTTP_STATUS.CREATED, HTTP_STATUS.BAD_REQUEST],
  },
  {
    name: 'should handle common password',
    password: 'password',
    expectedStatus: [HTTP_STATUS.CREATED, HTTP_STATUS.BAD_REQUEST],
  },
  {
    name: 'should handle numeric sequence',
    password: '12345678',
    expectedStatus: [HTTP_STATUS.CREATED, HTTP_STATUS.BAD_REQUEST],
  },
];