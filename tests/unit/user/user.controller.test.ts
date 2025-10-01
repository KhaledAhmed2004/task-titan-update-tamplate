import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserController } from '../../../src/app/modules/user/user.controller';
import { UserService } from '../../../src/app/modules/user/user.service';
import sendResponse from '../../../src/shared/sendResponse';
import { getSingleFilePath } from '../../../src/shared/getFilePath';
import { USER_STATUS } from '../../../src/enums/user';

// Import reusable test utilities
import { 
  MockExpressFactory, 
  ResponseAssertions, 
  MockAssertions 
} from '../../helpers';
import { 
  MockUserFixtures, 
  MockResponseFixtures,
  UserFixtures 
} from '../../fixtures';

// Mock dependencies
vi.mock('../../../src/app/modules/user/user.service');
vi.mock('../../../src/shared/sendResponse');
vi.mock('../../../src/shared/getFilePath');

describe('UserController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup mock request and response objects using reusable helpers
    const { mockRequest: req, mockResponse: res, mockNext: next } = MockExpressFactory.createExpressMocks();
    mockRequest = req;
    mockResponse = res;
    mockNext = next;
  });

  describe('createUser', () => {
    describe('Successful User Creation', () => {
      it('should create user successfully with valid data', async () => {
        // Arrange
        const userData = UserFixtures.validPoster;
        const expectedResult = MockUserFixtures.poster;

        mockRequest.body = userData;
        (UserService.createUserToDB as Mock).mockResolvedValue(expectedResult);

        // Act
        await UserController.createUser(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        MockAssertions.assertServiceCalled(UserService.createUserToDB, userData);
        ResponseAssertions.assertSuccessResponseUnit(sendResponse as Mock, mockResponse, {
          statusCode: StatusCodes.CREATED,
          success: true,
          message: 'User created successfully',
          data: expectedResult,
        });
      });

      it('should handle user creation with optional fields', async () => {
        // Arrange
        const userData = UserFixtures.validTasker;
        const expectedResult = MockUserFixtures.tasker;

        mockRequest.body = userData;
        (UserService.createUserToDB as Mock).mockResolvedValue(expectedResult);

        // Act
        await UserController.createUser(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        MockAssertions.assertServiceCalled(UserService.createUserToDB, userData);
        ResponseAssertions.assertSuccessResponseUnit(sendResponse as Mock, mockResponse, {
          statusCode: StatusCodes.CREATED,
          success: true,
          message: 'User created successfully',
          data: expectedResult,
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors during user creation', async () => {
        // Arrange
        const userData = UserFixtures.validPoster;
        const serviceError = new Error('Email already exists');

        mockRequest.body = userData;
        (UserService.createUserToDB as Mock).mockRejectedValue(serviceError);

        // Act
        await UserController.createUser(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        MockAssertions.assertErrorHandled(mockNext, serviceError);
        MockAssertions.assertServiceCalled(UserService.createUserToDB, userData);
        MockAssertions.assertNotCalled(sendResponse as Mock);
      });
    });
  });

  describe('getUserProfile', () => {
    describe('Successful Profile Retrieval', () => {
      it('should get user profile successfully', async () => {
        // Arrange
        const mockUser = {
          id: '64f123abc456def789012345',
          email: 'john@example.com',
          role: 'USER',
        };
        const expectedProfile = {
          id: '64f123abc456def789012345',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'USER',
          verified: true,
        };

        mockRequest.user = mockUser;
        (UserService.getUserProfileFromDB as Mock).mockResolvedValue(expectedProfile);

        // Act
        await UserController.getUserProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(UserService.getUserProfileFromDB).toHaveBeenCalledWith(mockUser);
        expect(sendResponse).toHaveBeenCalledWith(mockResponse, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Profile data retrieved successfully',
          data: expectedProfile,
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors during profile retrieval', async () => {
        // Arrange
        const mockUser = {
          id: '64f123abc456def789012345',
          email: 'john@example.com',
          role: 'USER',
        };
        const serviceError = new Error('User not found');

        mockRequest.user = mockUser;
        (UserService.getUserProfileFromDB as Mock).mockRejectedValue(serviceError);

        // Act
        await UserController.getUserProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(serviceError);
        expect(UserService.getUserProfileFromDB).toHaveBeenCalledWith(mockUser);
        expect(sendResponse).not.toHaveBeenCalled();
      });
    });
  });

  describe('updateProfile', () => {
    describe('Successful Profile Update', () => {
      it('should update profile successfully without image', async () => {
        // Arrange
        const mockUser = {
          id: '64f123abc456def789012345',
          email: 'john@example.com',
          role: 'USER',
        };
        const updateData = {
          name: 'John Updated',
          location: 'Los Angeles',
        };
        const expectedResult = {
          id: '64f123abc456def789012345',
          name: 'John Updated',
          location: 'Los Angeles',
        };

        mockRequest.user = mockUser;
        mockRequest.body = updateData;
        mockRequest.files = undefined;
        (getSingleFilePath as Mock).mockReturnValue(undefined);
        (UserService.updateProfileToDB as Mock).mockResolvedValue(expectedResult);

        // Act
        await UserController.updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(getSingleFilePath).toHaveBeenCalledWith(undefined, 'image');
        expect(UserService.updateProfileToDB).toHaveBeenCalledWith(mockUser, {
          image: undefined,
          ...updateData,
        });
        expect(sendResponse).toHaveBeenCalledWith(mockResponse, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Profile updated successfully',
          data: expectedResult,
        });
      });

      it('should update profile successfully with image', async () => {
        // Arrange
        const mockUser = {
          id: '64f123abc456def789012345',
          email: 'john@example.com',
          role: 'USER',
        };
        const updateData = {
          name: 'John Updated',
        };
        const imagePath = '/uploads/profiles/john-updated.jpg';
        // Create proper mock files with all required Express.Multer.File properties
        const mockFiles = {
          image: [{
            fieldname: 'image',
            originalname: 'profile.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            size: 1024,
            destination: '/uploads/image',
            filename: 'profile.jpg',
            path: '/uploads/image/profile.jpg',
            buffer: Buffer.from(''),
            stream: {} as any
          }]
        };
        const expectedResult = {
          id: '64f123abc456def789012345',
          name: 'John Updated',
          image: imagePath,
        };

        mockRequest.user = mockUser;
        mockRequest.body = updateData;
        mockRequest.files = mockFiles;
        (getSingleFilePath as Mock).mockReturnValue(imagePath);
        (UserService.updateProfileToDB as Mock).mockResolvedValue(expectedResult);

        // Act
        await UserController.updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(getSingleFilePath).toHaveBeenCalledWith(mockFiles, 'image');
        expect(UserService.updateProfileToDB).toHaveBeenCalledWith(mockUser, {
          image: imagePath,
          ...updateData,
        });
        expect(sendResponse).toHaveBeenCalledWith(mockResponse, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Profile updated successfully',
          data: expectedResult,
        });
      });

      it('should update profile with empty body', async () => {
        // Arrange
        const mockUser = {
          id: '64f123abc456def789012345',
          email: 'john@example.com',
          role: 'USER',
        };
        const expectedResult = {
          id: '64f123abc456def789012345',
          name: 'John Doe',
        };

        mockRequest.user = mockUser;
        mockRequest.body = {};
        mockRequest.files = undefined;
        (getSingleFilePath as Mock).mockReturnValue(undefined);
        (UserService.updateProfileToDB as Mock).mockResolvedValue(expectedResult);

        // Act
        await UserController.updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(UserService.updateProfileToDB).toHaveBeenCalledWith(mockUser, {
          image: undefined,
        });
        expect(sendResponse).toHaveBeenCalledWith(mockResponse, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Profile updated successfully',
          data: expectedResult,
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors during profile update', async () => {
        // Arrange
        const mockUser = {
          id: '64f123abc456def789012345',
          email: 'john@example.com',
          role: 'USER',
        };
        const updateData = { name: 'John Updated' };
        const serviceError = new Error('Update failed');

        mockRequest.user = mockUser;
        mockRequest.body = updateData;
        mockRequest.files = undefined;
        (getSingleFilePath as Mock).mockReturnValue(undefined);
        (UserService.updateProfileToDB as Mock).mockRejectedValue(serviceError);

        // Act
        await UserController.updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(serviceError);
        expect(UserService.updateProfileToDB).toHaveBeenCalledWith(mockUser, {
          image: undefined,
          ...updateData,
        });
        expect(sendResponse).not.toHaveBeenCalled();
      });
    });
  });

  describe('getAllUsers', () => {
    describe('Successful Users Retrieval', () => {
      it('should get all users successfully with pagination', async () => {
        // Arrange
        const queryParams = {
          page: '1',
          limit: '10',
          search: 'john',
        };
        const expectedResult = {
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
          },
          data: [
            { id: '1', name: 'John Doe', email: 'john@example.com' },
            { id: '2', name: 'John Smith', email: 'johnsmith@example.com' },
          ],
        };

        mockRequest.query = queryParams;
        (UserService.getAllUsers as Mock).mockResolvedValue(expectedResult);

        // Act
        await UserController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(UserService.getAllUsers).toHaveBeenCalledWith(queryParams);
        expect(sendResponse).toHaveBeenCalledWith(mockResponse, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Users retrieved successfully',
          pagination: expectedResult.pagination,
          data: expectedResult.data,
        });
      });

      it('should get all users with empty query', async () => {
        // Arrange
        const expectedResult = {
          pagination: {
            page: 1,
            limit: 10,
            total: 5,
            totalPages: 1,
          },
          data: [
            { id: '1', name: 'User 1', email: 'user1@example.com' },
            { id: '2', name: 'User 2', email: 'user2@example.com' },
          ],
        };

        mockRequest.query = {};
        (UserService.getAllUsers as Mock).mockResolvedValue(expectedResult);

        // Act
        await UserController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(UserService.getAllUsers).toHaveBeenCalledWith({});
        expect(sendResponse).toHaveBeenCalledWith(mockResponse, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Users retrieved successfully',
          pagination: expectedResult.pagination,
          data: expectedResult.data,
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors during users retrieval', async () => {
        // Arrange
        const serviceError = new Error('Database connection failed');

        mockRequest.query = {};
        (UserService.getAllUsers as Mock).mockRejectedValue(serviceError);

        // Act
        await UserController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(serviceError);
        expect(UserService.getAllUsers).toHaveBeenCalledWith({});
        expect(sendResponse).not.toHaveBeenCalled();
      });
    });
  });

  describe('getUserStats', () => {
    describe('Successful Stats Retrieval', () => {
      it('should get user stats successfully', async () => {
        // Arrange
        const expectedStats = {
          totalUsers: 150,
          activeUsers: 120,
          verifiedUsers: 100,
          newUsersThisMonth: 25,
        };

        (UserService.getUserStats as Mock).mockResolvedValue(expectedStats);

        // Act
        await UserController.getUserStats(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(UserService.getUserStats).toHaveBeenCalledWith();
        expect(sendResponse).toHaveBeenCalledWith(mockResponse, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User stats retrieved successfully',
          data: expectedStats,
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors during stats retrieval', async () => {
        // Arrange
        const serviceError = new Error('Stats calculation failed');

        (UserService.getUserStats as Mock).mockRejectedValue(serviceError);

        // Act
        await UserController.getUserStats(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(serviceError);
        expect(UserService.getUserStats).toHaveBeenCalledWith();
        expect(sendResponse).not.toHaveBeenCalled();
      });
    });
  });

  describe('blockUser', () => {
    describe('Successful User Blocking', () => {
      it('should block user successfully', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const expectedResult = {
          id: userId,
          name: 'John Doe',
          status: USER_STATUS.RESTRICTED,
        };

        mockRequest.params = { id: userId };
        (UserService.updateUserStatus as Mock).mockResolvedValue(expectedResult);

        // Act
        await UserController.blockUser(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(UserService.updateUserStatus).toHaveBeenCalledWith(userId, USER_STATUS.RESTRICTED);
        expect(sendResponse).toHaveBeenCalledWith(mockResponse, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User blocked successfully',
          data: expectedResult,
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors during user blocking', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const serviceError = new Error('User not found');

        mockRequest.params = { id: userId };
        (UserService.updateUserStatus as Mock).mockRejectedValue(serviceError);

        // Act
        await UserController.blockUser(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(serviceError);
        expect(UserService.updateUserStatus).toHaveBeenCalledWith(userId, USER_STATUS.RESTRICTED);
        expect(sendResponse).not.toHaveBeenCalled();
      });
    });
  });

  describe('unblockUser', () => {
    describe('Successful User Unblocking', () => {
      it('should unblock user successfully', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const expectedResult = {
          id: userId,
          name: 'John Doe',
          status: USER_STATUS.ACTIVE,
        };

        mockRequest.params = { id: userId };
        (UserService.updateUserStatus as Mock).mockResolvedValue(expectedResult);

        // Act
        await UserController.unblockUser(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(UserService.updateUserStatus).toHaveBeenCalledWith(userId, USER_STATUS.ACTIVE);
        expect(sendResponse).toHaveBeenCalledWith(mockResponse, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User unblocked successfully',
          data: expectedResult,
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors during user unblocking', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const serviceError = new Error('User not found');

        mockRequest.params = { id: userId };
        (UserService.updateUserStatus as Mock).mockRejectedValue(serviceError);

        // Act
        await UserController.unblockUser(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(serviceError);
        expect(UserService.updateUserStatus).toHaveBeenCalledWith(userId, USER_STATUS.ACTIVE);
        expect(sendResponse).not.toHaveBeenCalled();
      });
    });
  });

  describe('getUserById', () => {
    describe('Successful User Retrieval', () => {
      it('should get user by ID successfully', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const expectedResult = {
          user: {
            id: userId,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'USER',
          },
        };

        mockRequest.params = { id: userId };
        (UserService.getUserById as Mock).mockResolvedValue(expectedResult);

        // Act
        await UserController.getUserById(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(UserService.getUserById).toHaveBeenCalledWith(userId);
        expect(sendResponse).toHaveBeenCalledWith(mockResponse, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User data retrieved successfully',
          data: expectedResult,
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors during user retrieval', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const serviceError = new Error('User not found');

        mockRequest.params = { id: userId };
        (UserService.getUserById as Mock).mockRejectedValue(serviceError);

        // Act
        await UserController.getUserById(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(serviceError);
        expect(UserService.getUserById).toHaveBeenCalledWith(userId);
      });
    });
  });

  describe('getUserDistribution', () => {
    describe('Successful Distribution Retrieval', () => {
      it('should get user distribution successfully', async () => {
        // Arrange
        const expectedDistribution = {
          totalUsers: 100,
          posters: 60,
          taskers: 40,
          postersPercentage: 60,
          taskersPercentage: 40,
        };

        (UserService.getUserDistribution as Mock).mockResolvedValue(expectedDistribution);

        // Act
        await UserController.getUserDistribution(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(UserService.getUserDistribution).toHaveBeenCalledWith();
        expect(sendResponse).toHaveBeenCalledWith(mockResponse, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User distribution retrieved successfully',
          data: expectedDistribution,
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors during distribution retrieval', async () => {
        // Arrange
        const serviceError = new Error('Distribution calculation failed');
        (UserService.getUserDistribution as Mock).mockRejectedValue(serviceError);

        // Act
        await UserController.getUserDistribution(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(serviceError);
        expect(UserService.getUserDistribution).toHaveBeenCalledWith();
      });
    });
  });

  describe('getUserDetailsById', () => {
    describe('Successful User Details Retrieval', () => {
      it('should get user details by ID successfully', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const expectedResult = {
          id: userId,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'USER',
          verified: true,
          averageRating: 4.5,
          ratingsCount: 10,
        };

        mockRequest.params = { id: userId };
        (UserService.getUserDetailsById as Mock).mockResolvedValue(expectedResult);

        // Act
        await UserController.getUserDetailsById(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(UserService.getUserDetailsById).toHaveBeenCalledWith(userId);
        expect(sendResponse).toHaveBeenCalledWith(mockResponse, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User details retrieved successfully',
          data: expectedResult,
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors during user details retrieval', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const serviceError = new Error('User not found');

        mockRequest.params = { id: userId };
        (UserService.getUserDetailsById as Mock).mockRejectedValue(serviceError);

        // Act
        await UserController.getUserDetailsById(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(serviceError);
        expect(UserService.getUserDetailsById).toHaveBeenCalledWith(userId);
        expect(sendResponse).not.toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user in request for profile operations', async () => {
      // Arrange
      mockRequest.user = undefined;
      const serviceError = new Error('User not found');
      (UserService.getUserProfileFromDB as Mock).mockRejectedValue(serviceError);

      // Act
      await UserController.getUserProfile(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(UserService.getUserProfileFromDB).toHaveBeenCalledWith(undefined);
    });

    it('should handle missing ID parameter', async () => {
      // Arrange
      mockRequest.params = {};
      const serviceError = new Error('Invalid ID');
      (UserService.getUserById as Mock).mockRejectedValue(serviceError);

      // Act
      await UserController.getUserById(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(UserService.getUserById).toHaveBeenCalledWith(undefined);
    });

    it('should handle invalid ID format', async () => {
      // Arrange
      const invalidId = 'invalid-id-format';
      mockRequest.params = { id: invalidId };
      const serviceError = new Error('Invalid ObjectId format');
      (UserService.getUserById as Mock).mockRejectedValue(serviceError);

      // Act
      await UserController.getUserById(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(UserService.getUserById).toHaveBeenCalledWith(invalidId);
    });
  });
});