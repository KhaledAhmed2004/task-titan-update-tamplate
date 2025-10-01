import request from 'supertest';
import app from '../../../../src/app';
import { userDeletionScenarios } from '../scenarios/user-deletion.scenarios';
import { validateStatusCode, assertSuccessResponse, assertErrorResponse, generateNonExistentId, createTempUser } from '../utils/test-helpers';

export function createUserDeletionSuite(): void {
  describe('User Deletion Tests', () => {
    describe('User Deletion Scenarios', () => {
      it.each(userDeletionScenarios)(
        '$name',
        async ({ setupUser, userToDelete, useNonExistentId, invalidId, expectedStatus, shouldVerifyDeletion }) => {
          let userId: string;
          let tempUser: any;

          if (setupUser && userToDelete) {
            // Create a temporary user for deletion
            tempUser = await createTempUser(userToDelete);
            userId = tempUser._id.toString();
          } else if (useNonExistentId) {
            userId = generateNonExistentId();
          } else if (invalidId) {
            userId = invalidId;
          } else {
            userId = 'default-id';
          }

          const response = await request(app).delete(`/api/v1/user/${userId}`);

          validateStatusCode(response, expectedStatus);

          if (shouldVerifyDeletion && tempUser) {
            // For successful deletion, verify user is actually deleted
            if (response.status === 200) {
              const verifyResponse = await request(app).get(`/api/v1/user/${userId}`);
              expect(verifyResponse.status).toBe(404);
            }
          }

          // Handle different response structures
          if (Array.isArray(expectedStatus)) {
            if (expectedStatus.includes(response.status)) {
              if (response.status >= 200 && response.status < 300) {
                assertSuccessResponse(response, response.status);
              } else {
                assertErrorResponse(response, response.status);
              }
            }
          } else {
            if (expectedStatus >= 200 && expectedStatus < 300) {
              assertSuccessResponse(response, expectedStatus);
            } else {
              assertErrorResponse(response, expectedStatus);
            }
          }
        }
      );
    });
  });
}