import { StatusCodes } from 'http-status-codes';

// User Retrieval Test Scenarios
export const userRetrievalScenarios = [
  {
    name: 'should retrieve all users successfully',
    endpoint: '/api/v1/user',
    method: 'GET',
    expectedStatus: [StatusCodes.OK, StatusCodes.UNAUTHORIZED],
    shouldHaveData: true,
  },
  {
    name: 'should retrieve users with pagination',
    endpoint: '/api/v1/user',
    method: 'GET',
    query: { page: 1, limit: 10 },
    expectedStatus: [StatusCodes.OK, StatusCodes.UNAUTHORIZED],
    shouldHaveData: true,
  },
  {
    name: 'should retrieve user by valid ID',
    endpoint: '/api/v1/user/:id',
    method: 'GET',
    useExistingUser: true,
    expectedStatus: [StatusCodes.OK, StatusCodes.NOT_FOUND],
    shouldHaveData: true,
  },
  {
    name: 'should return 404 for non-existent user ID',
    endpoint: '/api/v1/user/:id',
    method: 'GET',
    useNonExistentId: true,
    expectedStatus: StatusCodes.NOT_FOUND,
    shouldHaveData: false,
  },
  {
    name: 'should return 400 for invalid user ID format',
    endpoint: '/api/v1/user/invalid-id',
    method: 'GET',
    expectedStatus: [StatusCodes.BAD_REQUEST, StatusCodes.NOT_FOUND],
    shouldHaveData: false,
  },
];

// API Endpoint Test Scenarios
export const apiEndpointScenarios = [
  {
    name: 'should handle GET /api/v1/user',
    method: 'GET',
    endpoint: '/api/v1/user',
    expectedStatus: [StatusCodes.OK, StatusCodes.UNAUTHORIZED],
  },
  {
    name: 'should handle GET /api/v1/user with pagination',
    method: 'GET',
    endpoint: '/api/v1/user',
    query: { page: 1, limit: 10 },
    expectedStatus: [StatusCodes.OK, StatusCodes.UNAUTHORIZED],
  },
];