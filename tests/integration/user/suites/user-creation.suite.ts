import request from 'supertest';
import app from '../../../../src/app';
import { 
  userCreationScenarios, 
  userValidationScenarios, 
  requiredFieldScenarios, 
  invalidEmailScenarios, 
  passwordStrengthScenarios 
} from '../scenarios/user-creation.scenarios';
import { validateStatusCode, assertSuccessResponse, assertErrorResponse } from '../utils/test-helpers';

export function createUserCreationSuite(): void {
  describe('User Creation Tests', () => {
    describe('User Creation Scenarios', () => {
      it.each(userCreationScenarios)(
        '$name',
        async ({ userData, expectedStatus, shouldCreateUser }) => {
          const response = await request(app)
            .post('/api/v1/user')
            .send(userData);

          validateStatusCode(response, expectedStatus);

          if (shouldCreateUser) {
            assertSuccessResponse(response, expectedStatus as number);
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data.email).toBe(userData.email);
            expect(response.body.data).not.toHaveProperty('password');
          } else {
            assertErrorResponse(response, expectedStatus as number);
          }
        }
      );
    });

    describe('User Validation Scenarios', () => {
      it.each(userValidationScenarios)(
        '$name',
        async ({ userData, expectedStatus, shouldCreateUser }) => {
          const response = await request(app)
            .post('/api/v1/user')
            .send(userData);

          validateStatusCode(response, expectedStatus);

          if (shouldCreateUser) {
            assertSuccessResponse(response, expectedStatus as number);
          } else {
            assertErrorResponse(response, expectedStatus as number);
          }
        }
      );
    });

    describe('Required Field Scenarios', () => {
      it.each(requiredFieldScenarios)(
        '$name',
        async ({ userData, expectedStatus }) => {
          const response = await request(app)
            .post('/api/v1/user')
            .send(userData);

          validateStatusCode(response, expectedStatus);
          assertErrorResponse(response, expectedStatus as number);
        }
      );
    });

    describe('Invalid Email Format Scenarios', () => {
      it.each(invalidEmailScenarios)(
        '$name',
        async ({ userData, expectedStatus }) => {
          const response = await request(app)
            .post('/api/v1/user')
            .send(userData);

          validateStatusCode(response, expectedStatus);
          assertErrorResponse(response, expectedStatus as number);
        }
      );
    });

    describe('Password Strength Scenarios', () => {
      it.each(passwordStrengthScenarios)(
        '$name',
        async ({ userData, expectedStatus, shouldCreateUser }) => {
          const response = await request(app)
            .post('/api/v1/user')
            .send(userData);

          validateStatusCode(response, expectedStatus);

          if (shouldCreateUser) {
            assertSuccessResponse(response, expectedStatus as number);
          } else {
            assertErrorResponse(response, expectedStatus as number);
          }
        }
      );
    });
  });
}