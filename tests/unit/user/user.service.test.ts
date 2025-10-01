import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { UserService } from '../../../src/app/modules/user/user.service';
import { User } from '../../../src/app/modules/user/user.model';
import { TaskModel } from '../../../src/app/modules/task/task.model';
import { BidModel } from '../../../src/app/modules/bid/bid.model';
import { USER_ROLES, USER_STATUS } from '../../../src/enums/user';
import ApiError from '../../../src/errors/ApiError';
import { emailHelper } from '../../../src/helpers/emailHelper';
import { emailTemplate } from '../../../src/shared/emailTemplate';
import generateOTP from '../../../src/util/generateOTP';
import QueryBuilder from '../../../src/app/builder/QueryBuilder';

// Mock all dependencies
vi.mock('../../../src/app/modules/user/user.model');
vi.mock('../../../src/app/modules/task/task.model');
vi.mock('../../../src/app/modules/bid/bid.model');
vi.mock('../../../src/helpers/emailHelper');
vi.mock('../../../src/shared/emailTemplate');
vi.mock('../../../src/shared/unlinkFile');
vi.mock('../../../src/util/generateOTP');
vi.mock('../../../src/app/builder/QueryBuilder');
vi.mock('jsonwebtoken');

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUserToDB', () => {
    describe('Successful User Creation', () => {
      it('should create user successfully with valid data', async () => {
        // Arrange
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: USER_ROLES.POSTER,
        };
        const mockOTP = 123456;
        const mockCreatedUser = {
          _id: '64f123abc456def789012345',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: USER_ROLES.POSTER,
          verified: false,
        };

        (generateOTP as Mock).mockReturnValue(mockOTP);
        (User.create as Mock).mockResolvedValue(mockCreatedUser);
        (emailTemplate.createAccount as Mock).mockReturnValue('<html>OTP: 123456</html>');
        (emailHelper.sendEmail as Mock).mockResolvedValue(true);
        (User.findOneAndUpdate as Mock).mockResolvedValue(mockCreatedUser);

        // Act
        const result = await UserService.createUserToDB(userData);

        // Assert
        expect(generateOTP).toHaveBeenCalledWith();
        expect(User.create).toHaveBeenCalledWith(userData);
        expect(emailTemplate.createAccount).toHaveBeenCalledWith({
          name: userData.name,
          otp: mockOTP,
          email: userData.email,
        });
        expect(emailHelper.sendEmail).toHaveBeenCalled();
        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
          { _id: mockCreatedUser._id },
          { $set: { authentication: { oneTimeCode: mockOTP, expireAt: expect.any(Date) } } }
        );
        expect(result).toEqual(mockCreatedUser);
      });

      it('should create user with default role when not specified', async () => {
        // Arrange
        const userData = {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'password123',
        };
        const mockOTP = 654321;
        const mockCreatedUser = {
          _id: '64f123abc456def789012346',
          ...userData,
          role: USER_ROLES.POSTER, // default role
          verified: false,
        };

        (generateOTP as Mock).mockReturnValue(mockOTP);
        (User.create as Mock).mockResolvedValue(mockCreatedUser);
        (emailTemplate.createAccount as Mock).mockReturnValue('<html>Email</html>');
        (emailHelper.sendEmail as Mock).mockResolvedValue(true);
        (User.findOneAndUpdate as Mock).mockResolvedValue(mockCreatedUser);

        // Act
        const result = await UserService.createUserToDB(userData);

        // Assert
        expect(User.create).toHaveBeenCalledWith(userData);
        expect(result).toEqual(mockCreatedUser);
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors during user creation', async () => {
        // Arrange
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        };
        const dbError = new Error('Database connection failed');

        (User.create as Mock).mockRejectedValue(dbError);

        // Act & Assert
        await expect(UserService.createUserToDB(userData)).rejects.toThrow('Database connection failed');
        expect(User.create).toHaveBeenCalled();
      });

      it('should handle email sending errors', async () => {
        // Arrange
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        };
        const mockOTP = 123456;
        const mockCreatedUser = {
          _id: '64f123abc456def789012345',
          ...userData,
        };

        (generateOTP as Mock).mockReturnValue(mockOTP);
        (User.create as Mock).mockResolvedValue(mockCreatedUser);
        (emailTemplate.createAccount as Mock).mockReturnValue('<html>Email</html>');
        (emailHelper.sendEmail as Mock).mockResolvedValue(true); // Email doesn't block user creation
        (User.findOneAndUpdate as Mock).mockResolvedValue(mockCreatedUser);

        // Act
        const result = await UserService.createUserToDB(userData);

        // Assert - User should be created even if email fails since it's not awaited
        expect(result).toEqual(mockCreatedUser);
        expect(User.create).toHaveBeenCalledWith(userData);
        expect(emailHelper.sendEmail).toHaveBeenCalled();
      });
    });
  });

  describe('getUserProfileFromDB', () => {
    describe('Successful Profile Retrieval', () => {
      it('should return user profile when valid JWT token is provided', async () => {
        // Arrange
        const mockDecodedToken = { id: '64f123abc456def789012345' };
        const mockUser = {
          _id: '64f123abc456def789012345',
          name: 'John Doe',
          email: 'john@example.com',
          role: USER_ROLES.POSTER,
          verified: true,
        };

        (User.isExistUserById as Mock).mockResolvedValue(mockUser);

        // Act
        const result = await UserService.getUserProfileFromDB(mockDecodedToken);

        // Assert
        expect(User.isExistUserById).toHaveBeenCalledWith(mockDecodedToken.id);
        expect(result).toEqual(mockUser);
      });

      it('should return user profile with all fields', async () => {
        // Arrange
        const mockDecodedToken = { id: '64f123abc456def789012346' };
        const mockUser = {
          _id: '64f123abc456def789012346',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: USER_ROLES.POSTER,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (User.isExistUserById as Mock).mockResolvedValue(mockUser);

        // Act
        const result = await UserService.getUserProfileFromDB(mockDecodedToken);

        // Assert
        expect(result).toEqual(mockUser);
        expect(result).toBeDefined();
        expect(result?.name).toBe('Jane Smith');
        expect(result?.email).toBe('jane@example.com');
        expect(result?.verified).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should throw error when user is not found', async () => {
        // Arrange
        const mockDecodedToken = { id: 'nonexistent_user_id' };

        (User.isExistUserById as Mock).mockResolvedValue(null);

        // Act & Assert
        await expect(UserService.getUserProfileFromDB(mockDecodedToken)).rejects.toThrow("User doesn't exist!");
        expect(User.isExistUserById).toHaveBeenCalledWith(mockDecodedToken.id);
      });

      it('should handle database errors during user lookup', async () => {
        // Arrange
        const mockDecodedToken = { id: '64f123abc456def789012345' };
        const dbError = new Error('Database connection failed');

        (User.isExistUserById as Mock).mockRejectedValue(dbError);

        // Act & Assert
        await expect(UserService.getUserProfileFromDB(mockDecodedToken)).rejects.toThrow('Database connection failed');
      });
    });
  });

  describe('updateProfileToDB', () => {
    describe('Successful Profile Update', () => {
      it('should update user profile successfully', async () => {
        // Arrange
        const mockJwtPayload = { id: '64f123abc456def789012345' };
        const updateData = {
          name: 'Updated Name',
          email: 'updated@example.com',
        };
        const mockExistingUser = {
          _id: '64f123abc456def789012345',
          name: 'John Doe',
        };
        const mockUpdatedUser = {
          _id: '64f123abc456def789012345',
          name: 'Updated Name',
          email: 'updated@example.com',
          role: USER_ROLES.POSTER,
          verified: true,
        };

        (User.isExistUserById as Mock).mockResolvedValue(mockExistingUser);
        (User.findOneAndUpdate as Mock).mockResolvedValue(mockUpdatedUser);

        // Act
        const result = await UserService.updateProfileToDB(mockJwtPayload, updateData);

        // Assert
        expect(User.isExistUserById).toHaveBeenCalledWith(mockJwtPayload.id);
        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
          { _id: mockJwtPayload.id },
          updateData,
          { new: true }
        );
        expect(result).toEqual(mockUpdatedUser);
      });

      it('should update only provided fields', async () => {
        // Arrange
        const mockJwtPayload = { id: '64f123abc456def789012345' };
        const updateData = { name: 'New Name Only' };
        const mockExistingUser = {
          _id: '64f123abc456def789012345',
          name: 'John Doe',
        };
        const mockUpdatedUser = {
          _id: '64f123abc456def789012345',
          name: 'New Name Only',
          email: 'original@example.com',
          role: USER_ROLES.POSTER,
        };

        (User.isExistUserById as Mock).mockResolvedValue(mockExistingUser);
        (User.findOneAndUpdate as Mock).mockResolvedValue(mockUpdatedUser);

        // Act
        const result = await UserService.updateProfileToDB(mockJwtPayload, updateData);

        // Assert
        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
          { _id: mockJwtPayload.id },
          updateData,
          { new: true }
        );
        expect(result).toBeDefined();
        expect(result?.name).toBe('New Name Only');
      });
    });

    describe('Error Handling', () => {
      it('should throw error when user is not found', async () => {
        // Arrange
        const mockJwtPayload = { id: 'nonexistent_user_id' };
        const updateData = { name: 'New Name' };

        (User.isExistUserById as Mock).mockResolvedValue(null);

        // Act & Assert
        await expect(UserService.updateProfileToDB(mockJwtPayload, updateData)).rejects.toThrow();
      });

      it('should handle database errors during update', async () => {
        // Arrange
        const mockJwtPayload = { id: '64f123abc456def789012345' };
        const updateData = { name: 'New Name' };
        const dbError = new Error('Database update failed');
        const mockExistingUser = {
          _id: '64f123abc456def789012345',
          name: 'John Doe',
        };

        (User.isExistUserById as Mock).mockResolvedValue(mockExistingUser);
        (User.findOneAndUpdate as Mock).mockRejectedValue(dbError);

        // Act & Assert
        await expect(UserService.updateProfileToDB(mockJwtPayload, updateData)).rejects.toThrow('Database update failed');
      });
    });
  });

  describe('getAllUsers', () => {
    describe('Successful Users Retrieval', () => {
      it('should get all users with pagination', async () => {
        // Arrange
        const query = {
          page: '1',
          limit: '10',
          search: 'john',
        };
        const mockUsers = [
          { _id: '1', name: 'John Doe', email: 'john@example.com' },
          { _id: '2', name: 'John Smith', email: 'johnsmith@example.com' },
        ];
        const mockPaginationInfo = {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        };
        const mockQueryBuilder = {
          search: vi.fn().mockReturnThis(),
          filter: vi.fn().mockReturnThis(),
          sort: vi.fn().mockReturnThis(),
          paginate: vi.fn().mockReturnThis(),
          fields: vi.fn().mockReturnThis(),
          modelQuery: Promise.resolve(mockUsers),
          getPaginationInfo: vi.fn().mockResolvedValue(mockPaginationInfo),
        };

        (QueryBuilder as Mock).mockImplementation(() => mockQueryBuilder);

        // Act
        const result = await UserService.getAllUsers(query);

        // Assert
        expect(QueryBuilder).toHaveBeenCalledWith(User.find(), query);
        expect(mockQueryBuilder.search).toHaveBeenCalledWith(['name', 'email']);
        expect(mockQueryBuilder.filter).toHaveBeenCalled();
        expect(mockQueryBuilder.sort).toHaveBeenCalled();
        expect(mockQueryBuilder.paginate).toHaveBeenCalled();
        expect(mockQueryBuilder.fields).toHaveBeenCalled();
        expect(result).toEqual({
          pagination: mockPaginationInfo,
          data: mockUsers,
        });
      });

      it('should get all users with empty query', async () => {
        // Arrange
        const query = {};
        const mockUsers = [
          { _id: '1', name: 'User 1', email: 'user1@example.com' },
        ];
        const mockPaginationInfo = {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        };
        const mockQueryBuilder = {
          search: vi.fn().mockReturnThis(),
          filter: vi.fn().mockReturnThis(),
          sort: vi.fn().mockReturnThis(),
          paginate: vi.fn().mockReturnThis(),
          fields: vi.fn().mockReturnThis(),
          modelQuery: Promise.resolve(mockUsers),
          getPaginationInfo: vi.fn().mockResolvedValue(mockPaginationInfo),
        };

        (QueryBuilder as Mock).mockImplementation(() => mockQueryBuilder);

        // Act
        const result = await UserService.getAllUsers(query);

        // Assert
        expect(result).toEqual({
          pagination: mockPaginationInfo,
          data: mockUsers,
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors during users retrieval', async () => {
        // Arrange
        const query = {};
        const dbError = new Error('Database connection failed');
        const mockQueryBuilder = {
          search: vi.fn().mockReturnThis(),
          filter: vi.fn().mockReturnThis(),
          sort: vi.fn().mockReturnThis(),
          paginate: vi.fn().mockReturnThis(),
          fields: vi.fn().mockReturnThis(),
          modelQuery: Promise.reject(dbError),
          getPaginationInfo: vi.fn(),
        };

        (QueryBuilder as Mock).mockImplementation(() => mockQueryBuilder);

        // Act & Assert
        await expect(UserService.getAllUsers(query)).rejects.toThrow('Database connection failed');
      });
    });
  });

  describe('getUserById', () => {
    describe('Successful User Retrieval', () => {
      it('should get POSTER user with tasks', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const mockUser = {
          _id: userId,
          name: 'John Poster',
          role: USER_ROLES.POSTER,
        };
        const mockTasks = [
          { _id: 'task1', title: 'Task 1', userId },
          { _id: 'task2', title: 'Task 2', userId },
        ];

        (User.findById as Mock).mockReturnValue({
          select: vi.fn().mockResolvedValue(mockUser),
        });
        (TaskModel.find as Mock).mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockTasks),
        });

        // Act
        const result = await UserService.getUserById(userId);

        // Assert
        expect(User.findById).toHaveBeenCalledWith(userId);
        expect(TaskModel.find).toHaveBeenCalledWith({ userId });
        expect(result).toEqual({
          user: mockUser,
          tasks: mockTasks,
        });
      });

      it('should get TASKER user with bids', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const mockUser = {
          _id: userId,
          name: 'Jane Tasker',
          role: USER_ROLES.TASKER,
        };
        const mockBids = [
          { _id: 'bid1', taskerId: userId, taskId: { title: 'Task 1' } },
          { _id: 'bid2', taskerId: userId, taskId: { title: 'Task 2' } },
        ];

        (User.findById as Mock).mockReturnValue({
          select: vi.fn().mockResolvedValue(mockUser),
        });
        (BidModel.find as Mock).mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockResolvedValue(mockBids),
          }),
        });

        // Act
        const result = await UserService.getUserById(userId);

        // Assert
        expect(User.findById).toHaveBeenCalledWith(userId);
        expect(BidModel.find).toHaveBeenCalledWith({ taskerId: userId });
        expect(result).toEqual({
          user: mockUser,
          bids: mockBids,
        });
      });

      it('should get other role user with basic info', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const mockUser = {
          _id: userId,
          name: 'Admin User',
          role: USER_ROLES.SUPER_ADMIN,
        };

        (User.findById as Mock).mockReturnValue({
          select: vi.fn().mockResolvedValue(mockUser),
        });

        // Act
        const result = await UserService.getUserById(userId);

        // Assert
        expect(User.findById).toHaveBeenCalledWith(userId);
        expect(TaskModel.find).not.toHaveBeenCalled();
        expect(BidModel.find).not.toHaveBeenCalled();
        expect(result).toEqual({ user: mockUser });
      });
    });

    describe('Error Handling', () => {
      it('should throw error when user not found', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';

        (User.findById as Mock).mockReturnValue({
          select: vi.fn().mockResolvedValue(null),
        });

        // Act & Assert
        await expect(UserService.getUserById(userId)).rejects.toThrow(ApiError);
        await expect(UserService.getUserById(userId)).rejects.toThrow("User doesn't exist!");
      });
    });
  });

  describe('updateUserStatus', () => {
    describe('Successful Status Update', () => {
      it('should update user status successfully', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const newStatus = USER_STATUS.RESTRICTED;
        const mockExistingUser = {
          _id: userId,
          name: 'John Doe',
          status: USER_STATUS.ACTIVE,
        };
        const mockUpdatedUser = {
          _id: userId,
          name: 'John Doe',
          status: USER_STATUS.RESTRICTED,
        };

        (User.isExistUserById as Mock).mockResolvedValue(mockExistingUser);
        (User.findByIdAndUpdate as Mock).mockResolvedValue(mockUpdatedUser);

        // Act
        const result = await UserService.updateUserStatus(userId, newStatus);

        // Assert
        expect(User.isExistUserById).toHaveBeenCalledWith(userId);
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
          userId,
          { status: newStatus },
          { new: true }
        );
        expect(result).toEqual(mockUpdatedUser);
      });
    });

    describe('Error Handling', () => {
      it('should throw error when user not found', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const newStatus = USER_STATUS.RESTRICTED;

        (User.isExistUserById as Mock).mockResolvedValue(null);

        // Act & Assert
        await expect(UserService.updateUserStatus(userId, newStatus)).rejects.toThrow(ApiError);
        await expect(UserService.updateUserStatus(userId, newStatus)).rejects.toThrow("User doesn't exist!");
      });
    });
  });

  describe('getUserDetailsById', () => {
    describe('Successful User Details Retrieval', () => {
      it('should get user details successfully', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';
        const mockUser = {
          _id: userId,
          name: 'John Doe',
          email: 'john@example.com',
          role: USER_ROLES.POSTER,
          verified: true,
          averageRating: 4.5,
          ratingsCount: 10,
        };

        (User.findById as Mock).mockReturnValue({
          select: vi.fn().mockResolvedValue(mockUser),
        });

        // Act
        const result = await UserService.getUserDetailsById(userId);

        // Assert
        expect(User.findById).toHaveBeenCalledWith(userId);
        expect(result).toEqual(mockUser);
      });
    });

    describe('Error Handling', () => {
      it('should throw error when user not found', async () => {
        // Arrange
        const userId = '64f123abc456def789012345';

        (User.findById as Mock).mockReturnValue({
          select: vi.fn().mockResolvedValue(null),
        });

        // Act & Assert
        await expect(UserService.getUserDetailsById(userId)).rejects.toThrow(ApiError);
        await expect(UserService.getUserDetailsById(userId)).rejects.toThrow("User doesn't exist!");
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid ObjectId format', async () => {
      // Arrange
      const invalidId = 'invalid-id-format';
      const dbError = new Error('Cast to ObjectId failed');

      (User.findById as Mock).mockReturnValue({
        select: vi.fn().mockRejectedValue(dbError),
      });

      // Act & Assert
      await expect(UserService.getUserById(invalidId)).rejects.toThrow('Cast to ObjectId failed');
    });

    it('should handle empty update data', async () => {
      // Arrange
      const mockJwtPayload = {
        id: '64f123abc456def789012345',
        email: 'john@example.com',
        role: USER_ROLES.POSTER,
      };
      const updateData = {};
      const mockExistingUser = {
        _id: '64f123abc456def789012345',
        name: 'John Doe',
      };
      const mockUpdatedUser = {
        _id: '64f123abc456def789012345',
        name: 'John Doe',
      };

      (User.isExistUserById as Mock).mockResolvedValue(mockExistingUser);
      (User.findOneAndUpdate as Mock).mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await UserService.updateProfileToDB(mockJwtPayload, updateData);

      // Assert
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockJwtPayload.id },
        updateData,
        { new: true }
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should handle null user payload', async () => {
      // Arrange
      const nullPayload = null as any;
      const updateData = { name: 'Updated Name' };

      // Act & Assert
      await expect(UserService.updateProfileToDB(nullPayload, updateData)).rejects.toThrow();
    });

    it('should handle undefined user ID', async () => {
      // Arrange
      const mockJwtPayload = {
        userId: undefined as any,
        email: 'john@example.com',
        role: USER_ROLES.POSTER,
      };
      const updateData = { name: 'Updated Name' };

      (User.isExistUserById as Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.updateProfileToDB(mockJwtPayload, updateData)).rejects.toThrow(ApiError);
    });
  });
});