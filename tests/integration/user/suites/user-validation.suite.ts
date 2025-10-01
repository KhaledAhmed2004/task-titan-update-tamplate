import request from 'supertest';
import app from '../../../../src/app';
import { validationTestScenarios, securityTestScenarios, edgeCaseScenarios } from '../scenarios/user-validation.scenarios';
import { validateStatusCode, assertSuccessResponse, assertErrorResponse, testUsers } from '../utils/test-helpers';

export function createUserValidationSuite(): void {
  describe('User Validation and Security Tests', () => {
    describe('Validation Test Scenarios', () => {
      it.each(validationTestScenarios)(
        '$name',
        async ({ testType, payload, emails, passwords, expectedStatus }) => {
          let response: any;

          switch (testType) {
            case 'malformed_json':
              // Test malformed JSON by sending raw string
              response = await request(app)
                .post('/api/v1/user')
                .set('Content-Type', 'application/json')
                .send(payload);
              break;

            case 'email_validation':
              // Test multiple email formats
              if (emails) {
                for (const email of emails) {
                  response = await request(app)
                    .post('/api/v1/user')
                    .send({
                      name: 'Test User',
                      email: email,
                      password: 'password123',
                    });
                  
                  validateStatusCode(response, expectedStatus);
                }
                return; // Exit early for email validation
              }
              break;

            case 'password_strength':
              // Test multiple password strengths
              if (passwords) {
                for (const password of passwords) {
                  response = await request(app)
                    .post('/api/v1/user')
                    .send({
                      name: 'Test User',
                      email: `test-${Date.now()}@example.com`,
                      password: password,
                    });
                  
                  validateStatusCode(response, expectedStatus);
                }
                return; // Exit early for password validation
              }
              break;
          }

          if (response) {
            validateStatusCode(response, expectedStatus);
          }
        }
      );
    });

    describe('Security Test Scenarios', () => {
      it.each(securityTestScenarios)(
        '$name',
        async ({ testType, endpoint, payload, expectedStatus, forbiddenWords, existingEmail, nonExistingEmail, maxTimeDifference }) => {
          let response: any;

          switch (testType) {
            case 'sensitive_info':
              if (endpoint) {
                response = await request(app).get(endpoint);
                validateStatusCode(response, expectedStatus);
                
                // Check that response doesn't contain sensitive information
                if (forbiddenWords) {
                  const responseText = JSON.stringify(response.body).toLowerCase();
                  forbiddenWords.forEach(word => {
                    expect(responseText).not.toContain(word.toLowerCase());
                  });
                }
              }
              break;

            case 'malicious_input':
              if (payload) {
                response = await request(app)
                  .post('/api/v1/user')
                  .send(payload);
                
                validateStatusCode(response, expectedStatus);
                
                // Verify that malicious input is handled properly
                if (response.status >= 200 && response.status < 300) {
                  expect(response.body.data.name).not.toContain('<script>');
                }
              }
              break;

            case 'timing_attack':
              if (existingEmail && nonExistingEmail && maxTimeDifference) {
                // Test timing for existing email
                const startTime1 = Date.now();
                const response1 = await request(app)
                  .post('/api/v1/user')
                  .send({
                    name: 'Test User',
                    email: existingEmail,
                    password: 'password123',
                  });
                const endTime1 = Date.now();

                // Test timing for non-existing email
                const startTime2 = Date.now();
                const response2 = await request(app)
                  .post('/api/v1/user')
                  .send({
                    name: 'Test User',
                    email: nonExistingEmail,
                    password: 'password123',
                  });
                const endTime2 = Date.now();

                const timeDiff = Math.abs((endTime1 - startTime1) - (endTime2 - startTime2));
                expect(timeDiff).toBeLessThan(maxTimeDifference);
              }
              break;
          }
        }
      );
    });

    describe('Edge Case Scenarios', () => {
      it.each(edgeCaseScenarios)(
        '$name',
        async ({ testType, endpoint, timeout, concurrentCount, payload, expectedStatus }) => {
          switch (testType) {
            case 'database_connection':
              if (endpoint && timeout) {
                const response = await request(app)
                  .get(endpoint)
                  .timeout(timeout);
                
                // Should handle gracefully even if database is slow
                expect(response.status).toBeDefined();
              }
              break;

            case 'concurrent_creation':
              if (concurrentCount) {
                const promises = Array.from({ length: concurrentCount }, (_, i) => 
                  request(app)
                    .post('/api/v1/user')
                    .send({
                      name: `Concurrent User ${i}`,
                      email: `concurrent${i}-${Date.now()}@test.com`,
                      password: 'password123',
                    })
                );

                const responses = await Promise.all(promises);
                
                // At least one should succeed or all should fail gracefully
                responses.forEach(response => {
                  validateStatusCode(response, expectedStatus);
                });
              }
              break;

            case 'large_payload':
              if (payload) {
                const response = await request(app)
                  .post('/api/v1/user')
                  .send({
                    ...payload,
                    email: `large-payload-${Date.now()}@test.com`,
                    password: 'password123',
                  });
                
                validateStatusCode(response, expectedStatus);
              }
              break;
          }
        }
      );
    });
  });
}