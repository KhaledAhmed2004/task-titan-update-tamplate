import { StatusCodes } from 'http-status-codes';

// User Deletion Test Scenarios
export const userDeletionScenarios = [
  {
    name: 'should delete user successfully',
    setupUser: true,
    userToDelete: {
      name: 'Delete Me',
      email: 'delete@test.com',
    },
    expectedStatus: [StatusCodes.OK, StatusCodes.NOT_FOUND],
    shouldVerifyDeletion: true,
  },
  {
    name: 'should return 404 when deleting non-existent user',
    setupUser: false,
    useNonExistentId: true,
    expectedStatus: StatusCodes.NOT_FOUND,
    shouldVerifyDeletion: false,
  },
  {
    name: 'should return 400 for invalid ID format',
    setupUser: false,
    invalidId: 'invalid-id',
    expectedStatus: [StatusCodes.BAD_REQUEST, StatusCodes.NOT_FOUND],
    shouldVerifyDeletion: false,
  },
];