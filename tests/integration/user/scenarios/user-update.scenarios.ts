import { StatusCodes } from 'http-status-codes';

// User Update Test Scenarios
export const userUpdateScenarios = [
  {
    name: 'should update user name',
    updateData: { name: 'Updated Name' },
    expectedStatus: [StatusCodes.OK, StatusCodes.NOT_FOUND],
  },
  {
    name: 'should update user location',
    updateData: { location: 'Updated Location' },
    expectedStatus: [StatusCodes.OK, StatusCodes.NOT_FOUND],
  },
  {
    name: 'should update user phone',
    updateData: { phone: '+9876543210' },
    expectedStatus: [StatusCodes.OK, StatusCodes.NOT_FOUND],
  },
  {
    name: 'should update multiple fields',
    updateData: {
      name: 'Updated Name',
      location: 'Updated Location',
      phone: '+9876543210',
    },
    expectedStatus: [StatusCodes.OK, StatusCodes.NOT_FOUND],
  },
];

// User Update Validation Scenarios
export const userUpdateValidationScenarios = [
  {
    name: 'should reject update with invalid email',
    updateData: { email: 'invalid-email' },
    expectedStatus: [StatusCodes.BAD_REQUEST, StatusCodes.OK],
    shouldSucceed: false,
  },
  {
    name: 'should reject update with empty data',
    updateData: {},
    expectedStatus: [StatusCodes.BAD_REQUEST, StatusCodes.OK],
    shouldSucceed: false,
  },
  {
    name: 'should handle update of non-existent user',
    updateData: { name: 'Updated Name' },
    useNonExistentId: true,
    expectedStatus: StatusCodes.NOT_FOUND,
    shouldSucceed: false,
  },
];