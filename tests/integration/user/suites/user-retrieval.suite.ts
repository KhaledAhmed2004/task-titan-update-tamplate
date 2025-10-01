import request from 'supertest';
import app from '../../../../src/app';
import { 
  userRetrievalScenarios, 
  userByIdScenarios, 
  apiEndpointScenarios 
} from '../scenarios/user-retrieval.scenarios';
import { validateStatusCode, assertSuccessResponse, assertErrorResponse, testUsers, generateNonExistentId } from '../utils/test-helpers';

export function createUserRetrievalSuite(): void {
  describe('User Retrieval Tests', () => {
    describe('User Retrieval Scenarios', () => {
      it.each(userRetrievalScenarios)(
        '$name',
        async ({ endpoint, queryParams, expectedStatus, shouldReturnUsers }) => {
          let url = endpoint;
          if (queryParams) {
            const params = new URLSearchParams(queryParams);
            url += `?${params.toString()}`;
          }

          const response = await request(app).get(url);

          validateStatusCode(response, expectedStatus);

          if (shouldReturnUsers) {
            assertSuccessResponse(response, expectedStatus as number);
            expect(response.body.data).toBeDefined();
            if (Array.isArray(response.body.data)) {
              expect(response.body.data.length).toBeGreaterThanOrEqual(0);
            }
          } else {
            assertErrorResponse(response, expectedStatus as number);
          }
        }
      );
    });

    describe('User By ID Scenarios', () => {
      it.each(userByIdScenarios)(
        '$name',
        async ({ useValidId, useInvalidId, expectedStatus, shouldReturnUser }) => {
          let userId: string;
          
          if (useValidId) {
            userId = testUsers.poster._id || 'valid-id';
          } else if (useInvalidId) {
            userId = 'invalid-id-format';
          } else {
            userId = generateNonExistentId();
          }

          const response = await request(app).get(`/api/v1/user/${userId}`);

          validateStatusCode(response, expectedStatus);

          if (shouldReturnUser) {
            assertSuccessResponse(response, expectedStatus as number);
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data).not.toHaveProperty('password');
          } else {
            assertErrorResponse(response, expectedStatus as number);
          }
        }
      );
    });

    describe('API Endpoint Scenarios', () => {
      it.each(apiEndpointScenarios)(
        '$name',
        async ({ endpoint, expectedStatus, shouldReturnData }) => {
          const response = await request(app).get(endpoint);

          validateStatusCode(response, expectedStatus);

          if (shouldReturnData) {
            assertSuccessResponse(response, expectedStatus as number);
            expect(response.body.data).toBeDefined();
          } else {
            assertErrorResponse(response, expectedStatus as number);
          }
        }
      );
    });
  });
}