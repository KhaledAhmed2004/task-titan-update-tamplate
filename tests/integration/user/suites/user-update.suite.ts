import request from 'supertest';
import app from '../../../../src/app';
import { userUpdateScenarios } from '../scenarios/user-update.scenarios';
import { validateStatusCode, assertSuccessResponse, assertErrorResponse, testUsers, generateNonExistentId, createTempUser } from '../utils/test-helpers';

export function createUserUpdateSuite(): void {
  describe('User Update Tests', () => {
    describe('User Update Scenarios', () => {
      it.each(userUpdateScenarios)(
        '$name',
        async ({ updateData, useValidId, useNonExistentId, expectedStatus, shouldUpdateUser }) => {
          let userId: string;
          let tempUser: any;

          if (useValidId) {
            // Create a temporary user for update tests
            tempUser = await createTempUser({
              name: 'Update Test User',
              email: `update-test-${Date.now()}@test.com`,
              password: 'password123',
            });
            userId = tempUser._id.toString();
          } else if (useNonExistentId) {
            userId = generateNonExistentId();
          } else {
            userId = testUsers.poster._id || 'default-id';
          }

          const response = await request(app)
            .put(`/api/v1/user/${userId}`)
            .send(updateData);

          validateStatusCode(response, expectedStatus);

          if (shouldUpdateUser) {
            assertSuccessResponse(response, expectedStatus as number);
            expect(response.body.data).toHaveProperty('_id');
            
            // Verify specific field updates
            if (updateData.name) {
              expect(response.body.data.name).toBe(updateData.name);
            }
            if (updateData.location) {
              expect(response.body.data.location).toBe(updateData.location);
            }
            if (updateData.phone) {
              expect(response.body.data.phone).toBe(updateData.phone);
            }
          } else {
            assertErrorResponse(response, expectedStatus as number);
          }

          // Cleanup temporary user if created
          if (tempUser) {
            try {
              await request(app).delete(`/api/v1/user/${tempUser._id}`);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
        }
      );
    });
  });
}