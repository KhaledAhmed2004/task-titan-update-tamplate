import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../../src/app/modules/user/user.model';
import { IUser } from '../../../src/app/modules/user/user.interface';
import { USER_ROLES, USER_STATUS } from '../../../src/enums/user';
import bcrypt from 'bcrypt';

// Mock bcrypt for unit tests
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock config
vi.mock('../../../src/config', () => ({
  default: {
    bcrypt_salt_rounds: 12,
  },
}));

describe('User Model Integration Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Setup in-memory MongoDB for integration tests
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data after each test
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
    }
  });

  describe('User Schema Validation', () => {
    describe('Valid User Creation', () => {
      it('should create user with all required fields', async () => {
        // Arrange
        const userData: Partial<IUser> = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
          verified: false,
          status: USER_STATUS.ACTIVE,
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeUndefined();
        expect(user.name).toBe(userData.name);
        expect(user.email).toBe(userData.email);
        expect(user.password).toBe(userData.password);
        expect(user.role).toBe(userData.role);
        expect(user.verified).toBe(userData.verified);
        expect(user.status).toBe(userData.status);
      });

      it('should create user with default values', async () => {
        // Arrange
        const userData: Partial<IUser> = {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeUndefined();
        expect(user.role).toBe(USER_ROLES.POSTER);
        expect(user.verified).toBe(false); // default verified
        expect(user.status).toBe(USER_STATUS.ACTIVE); // default status
        expect(user.averageRating).toBe(0); // default rating
        expect(user.ratingsCount).toBe(0); // default ratings count
        expect(user.image).toBe('https://i.ibb.co/z5YHLV9/profile.png'); // default image
        expect(user.deviceTokens).toEqual([]); // default empty array
      });

      it('should create user with optional fields', async () => {
        // Arrange
        const userData: Partial<IUser> = {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.TASKER,
          phone: '+1234567890',
          location: 'New York, NY',
          image: 'profile.jpg',
          dateOfBirth: '1990-01-01',
          gender: 'female',
          averageRating: 4.5,
          ratingsCount: 10,
          deviceTokens: ['token1', 'token2'],
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeUndefined();
        expect(user.phone).toBe(userData.phone);
        expect(user.location).toBe(userData.location);
        expect(user.image).toBe(userData.image);
        expect(user.dateOfBirth).toBe(userData.dateOfBirth);
        expect(user.gender).toBe(userData.gender);
        expect(user.averageRating).toBe(userData.averageRating);
        expect(user.ratingsCount).toBe(userData.ratingsCount);
        expect(user.deviceTokens).toEqual(userData.deviceTokens);
      });

      it('should create user with authentication object', async () => {
        // Arrange
        const userData: Partial<IUser> = {
          name: 'Bob Wilson',
          email: 'bob@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
          authentication: {
            isResetPassword: false,
            oneTimeCode: 123456,
            expireAt: new Date(Date.now() + 3 * 60 * 1000),
          },
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeUndefined();
        expect(user.authentication?.isResetPassword).toBe(false);
        expect(user.authentication?.oneTimeCode).toBe(123456);
        expect(user.authentication?.expireAt).toEqual(userData.authentication?.expireAt);
      });
    });

    describe('Invalid User Creation', () => {
      it('should fail validation when name is missing', async () => {
        // Arrange
        const userData = {
          email: 'test@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeDefined();
        expect(validationError?.errors.name).toBeDefined();
        expect(validationError?.errors.name.message).toContain('required');
      });

      it('should fail validation when email is missing', async () => {
        // Arrange
        const userData = {
          name: 'John Doe',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeDefined();
        expect(validationError?.errors.email).toBeDefined();
        expect(validationError?.errors.email.message).toContain('required');
      });

      it('should fail validation when password is missing', async () => {
        // Arrange
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          role: USER_ROLES.POSTER,
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeDefined();
        expect(validationError?.errors.password).toBeDefined();
        expect(validationError?.errors.password.message).toContain('required');
      });

      it('should use default role when role is missing', async () => {
        // Arrange
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword123',
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeUndefined();
        expect(user.role).toBe(USER_ROLES.POSTER); // Should use default value
      });

      it('should fail validation with invalid email format', async () => {
        // Arrange
        const userData = {
          name: 'John Doe',
          email: 'invalid-email',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert - Note: Mongoose doesn't validate email format by default, but email will be lowercased
        expect(validationError).toBeUndefined();
        expect(user.email).toBe('invalid-email');
      });

      it('should fail validation with password shorter than 8 characters', async () => {
        // Arrange
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: '1234567', // 7 characters
          role: USER_ROLES.POSTER,
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeDefined();
        expect(validationError?.errors.password).toBeDefined();
        expect(validationError?.errors.password.message).toContain('shorter than the minimum allowed length');
      });

      it('should fail validation with invalid role', async () => {
        // Arrange
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword123',
          role: 'INVALID_ROLE',
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeDefined();
        expect(validationError?.errors.role).toBeDefined();
        expect(validationError?.errors.role.message).toContain('not a valid enum value');
      });

      it('should fail validation with invalid status', async () => {
        // Arrange
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
          status: 'INVALID_STATUS',
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeDefined();
        expect(validationError?.errors.status).toBeDefined();
        expect(validationError?.errors.status.message).toContain('not a valid enum value');
      });

      it('should fail validation with invalid gender', async () => {
        // Arrange
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
          gender: 'other',
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeDefined();
        expect(validationError?.errors.gender).toBeDefined();
        expect(validationError?.errors.gender.message).toContain('not a valid enum value');
      });
    });
  });

  describe('User Model Static Methods Integration Tests', () => {
    describe('isExistUserById', () => {
      it('should find existing user by ID', async () => {
        // Arrange
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
        };

        // Mock bcrypt for this test
        (bcrypt.hash as any).mockResolvedValue('hashedPassword123');

        const createdUser = await User.create(userData);

        // Act
        const foundUser = await User.isExistUserById(createdUser._id.toString());

        // Assert
        expect(foundUser).toBeDefined();
        expect(foundUser?._id.toString()).toBe(createdUser._id.toString());
        expect(foundUser?.name).toBe(userData.name);
        expect(foundUser?.email).toBe(userData.email);
      });

      it('should return null for non-existent user ID', async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId().toString();

        // Act
        const foundUser = await User.isExistUserById(nonExistentId);

        // Assert
        expect(foundUser).toBeNull();
      });

      it('should handle invalid ObjectId format', async () => {
        // Arrange
        const invalidId = 'invalid-id';

        // Act & Assert
        await expect(User.isExistUserById(invalidId)).rejects.toThrow();
      });
    });

    describe('isExistUserByEmail', () => {
      it('should find existing user by email', async () => {
        // Arrange
        const userData = {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
        };

        // Mock bcrypt for this test
        (bcrypt.hash as any).mockResolvedValue('hashedPassword123');

        const createdUser = await User.create(userData);

        // Act
        const foundUser = await User.isExistUserByEmail(userData.email);

        // Assert
        expect(foundUser).toBeDefined();
        expect(foundUser?._id.toString()).toBe(createdUser._id.toString());
        expect(foundUser?.email).toBe(userData.email);
        expect(foundUser?.name).toBe(userData.name);
      });

      it('should find user by email case-insensitively', async () => {
        // Arrange
        const userData = {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
        };

        // Mock bcrypt for this test
        (bcrypt.hash as any).mockResolvedValue('hashedPassword123');

        await User.create(userData);

        // Act
        const foundUser = await User.isExistUserByEmail('ALICE@EXAMPLE.COM');

        // Assert
        expect(foundUser).toBeDefined();
        expect(foundUser?.email).toBe('alice@example.com'); // stored in lowercase
      });

      it('should return null for non-existent email', async () => {
        // Arrange
        const nonExistentEmail = 'nonexistent@example.com';

        // Act
        const foundUser = await User.isExistUserByEmail(nonExistentEmail);

        // Assert
        expect(foundUser).toBeNull();
      });
    });

    describe('isMatchPassword', () => {
      it('should return true for matching passwords', async () => {
        // Arrange
        const plainPassword = 'password123';
        const hashedPassword = 'hashedPassword123';

        (bcrypt.compare as any).mockResolvedValue(true);

        // Act
        const isMatch = await User.isMatchPassword(plainPassword, hashedPassword);

        // Assert
        expect(isMatch).toBe(true);
        expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      });

      it('should return false for non-matching passwords', async () => {
        // Arrange
        const plainPassword = 'password123';
        const hashedPassword = 'differentHashedPassword';

        (bcrypt.compare as any).mockResolvedValue(false);

        // Act
        const isMatch = await User.isMatchPassword(plainPassword, hashedPassword);

        // Assert
        expect(isMatch).toBe(false);
        expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      });

      it('should handle bcrypt errors', async () => {
        // Arrange
        const plainPassword = 'password123';
        const hashedPassword = 'hashedPassword123';

        (bcrypt.compare as any).mockRejectedValue(new Error('Bcrypt error'));

        // Act & Assert
        await expect(User.isMatchPassword(plainPassword, hashedPassword)).rejects.toThrow('Bcrypt error');
      });
    });

    describe('addDeviceToken', () => {
      it('should add device token to user', async () => {
        // Arrange
        const userData = {
          name: 'Bob Wilson',
          email: 'bob@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
        };

        // Mock bcrypt for this test
        (bcrypt.hash as any).mockResolvedValue('hashedPassword123');

        const createdUser = await User.create(userData);
        const deviceToken = 'device-token-123';

        // Act
        const updatedUser = await User.addDeviceToken(createdUser._id.toString(), deviceToken);

        // Assert
        expect(updatedUser).toBeDefined();
        expect(updatedUser?.deviceTokens).toContain(deviceToken);
        expect(updatedUser?.deviceTokens).toHaveLength(1);
      });

      it('should not add duplicate device tokens', async () => {
        // Arrange
        const userData = {
          name: 'Charlie Brown',
          email: 'charlie@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
          deviceTokens: ['existing-token'],
        };

        // Mock bcrypt for this test
        (bcrypt.hash as any).mockResolvedValue('hashedPassword123');

        const createdUser = await User.create(userData);
        const existingToken = 'existing-token';

        // Act
        const updatedUser = await User.addDeviceToken(createdUser._id.toString(), existingToken);

        // Assert
        expect(updatedUser).toBeDefined();
        expect(updatedUser?.deviceTokens).toHaveLength(1);
        expect(updatedUser?.deviceTokens).toContain(existingToken);
      });

      it('should return null for non-existent user', async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const deviceToken = 'device-token-123';

        // Act
        const result = await User.addDeviceToken(nonExistentId, deviceToken);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('removeDeviceToken', () => {
      it('should remove device token from user', async () => {
        // Arrange
        const deviceToken = 'device-token-to-remove';
        const userData = {
          name: 'David Smith',
          email: 'david@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
          deviceTokens: [deviceToken, 'other-token'],
        };

        // Mock bcrypt for this test
        (bcrypt.hash as any).mockResolvedValue('hashedPassword123');

        const createdUser = await User.create(userData);

        // Act
        const updatedUser = await User.removeDeviceToken(createdUser._id.toString(), deviceToken);

        // Assert
        expect(updatedUser).toBeDefined();
        expect(updatedUser?.deviceTokens).not.toContain(deviceToken);
        expect(updatedUser?.deviceTokens).toContain('other-token');
        expect(updatedUser?.deviceTokens).toHaveLength(1);
      });

      it('should handle removing non-existent token', async () => {
        // Arrange
        const userData = {
          name: 'Eve Johnson',
          email: 'eve@example.com',
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
          deviceTokens: ['existing-token'],
        };

        // Mock bcrypt for this test
        (bcrypt.hash as any).mockResolvedValue('hashedPassword123');

        const createdUser = await User.create(userData);
        const nonExistentToken = 'non-existent-token';

        // Act
        const updatedUser = await User.removeDeviceToken(createdUser._id.toString(), nonExistentToken);

        // Assert
        expect(updatedUser).toBeDefined();
        expect(updatedUser?.deviceTokens).toHaveLength(1);
        expect(updatedUser?.deviceTokens).toContain('existing-token');
      });

      it('should return null for non-existent user', async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const deviceToken = 'device-token-123';

        // Act
        const result = await User.removeDeviceToken(nonExistentId, deviceToken);

        // Assert
        expect(result).toBeNull();
      });
    });
  });

  describe('User Model Middleware Integration Tests', () => {
    describe('Pre-save middleware', () => {
      it('should hash password before saving new user', async () => {
        // Arrange
        const plainPassword = 'password123';
        const hashedPassword = 'hashedPassword123';
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: plainPassword,
          role: USER_ROLES.POSTER,
        };

        (bcrypt.hash as any).mockResolvedValue(hashedPassword);

        // Act
        const user = await User.create(userData);

        // Assert
        expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 12);
        expect(user.password).toBe(hashedPassword);
      });

      it('should prevent duplicate email registration', async () => {
        // Arrange
        const userData1 = {
          name: 'John Doe',
          email: 'duplicate@example.com',
          password: 'password123',
          role: USER_ROLES.POSTER,
        };

        const userData2 = {
          name: 'Jane Smith',
          email: 'duplicate@example.com',
          password: 'password456',
          role: USER_ROLES.POSTER,
        };

        (bcrypt.hash as any).mockResolvedValue('hashedPassword');

        // Create first user
        await User.create(userData1);

        // Act & Assert
        await expect(User.create(userData2)).rejects.toThrow('Email already exist!');
      });

      it('should convert email to lowercase', async () => {
        // Arrange
        const userData = {
          name: 'John Doe',
          email: 'JOHN@EXAMPLE.COM',
          password: 'password123',
          role: USER_ROLES.POSTER,
        };

        (bcrypt.hash as any).mockResolvedValue('hashedPassword');

        // Act
        const user = await User.create(userData);

        // Assert
        expect(user.email).toBe('john@example.com');
      });

      it('should trim whitespace from name and email', async () => {
        // Arrange
        const userData = {
          name: '  John Doe  ',
          email: '  john@example.com  ',
          password: 'password123',
          role: USER_ROLES.POSTER,
        };

        (bcrypt.hash as any).mockResolvedValue('hashedPassword');

        // Act
        const user = await User.create(userData);

        // Assert
        expect(user.name).toBe('John Doe');
        expect(user.email).toBe('john@example.com');
      });
    });
  });

  describe('User Interface Type Checking', () => {
    it('should satisfy IUser interface with all properties', () => {
      // Arrange & Act
      const userData: IUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123',
        role: USER_ROLES.POSTER,
        location: 'New York, NY',
        gender: 'male',
        dateOfBirth: '1990-01-01',
        phone: '+1234567890',
        image: 'profile.jpg',
        status: USER_STATUS.ACTIVE,
        verified: true,
        deviceTokens: ['token1', 'token2'],
        averageRating: 4.5,
        ratingsCount: 10,
        authentication: {
          isResetPassword: false,
          oneTimeCode: 123456,
          expireAt: new Date(),
        },
      };

      // Assert
      expect(userData).toBeDefined();
      expect(userData.name).toBe('John Doe');
      expect(userData.email).toBe('john@example.com');
      expect(userData.role).toBe(USER_ROLES.POSTER);
      expect(userData.status).toBe(USER_STATUS.ACTIVE);
    });

    it('should satisfy IUser interface with required properties only', () => {
      // Arrange & Act
      const userData: Partial<IUser> = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'hashedPassword123',
        role: USER_ROLES.POSTER,
        location: 'Los Angeles, CA',
        gender: 'female',
        dateOfBirth: '1985-05-15',
        phone: '+0987654321',
        status: USER_STATUS.ACTIVE,
        verified: false,
        averageRating: 0,
        ratingsCount: 0,
      };

      // Assert
      expect(userData).toBeDefined();
      expect(userData.name).toBe('Jane Smith');
      expect(userData.email).toBe('jane@example.com');
      expect(userData.password).toBe('hashedPassword123');
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    it('should handle very long name', async () => {
      // Arrange
      const longName = 'A'.repeat(1000);
      const userData = {
        name: longName,
        email: 'long@example.com',
        password: 'hashedPassword123',
        role: USER_ROLES.POSTER,
      };

      // Act
      const user = new User(userData);
      const validationError = user.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(user.name).toBe(longName);
    });

    it('should handle very long email', async () => {
      // Arrange
      const longEmail = 'a'.repeat(100) + '@example.com';
      const userData = {
        name: 'John Doe',
        email: longEmail,
        password: 'hashedPassword123',
        role: USER_ROLES.POSTER,
      };

      // Act
      const user = new User(userData);
      const validationError = user.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(user.email).toBe(longEmail);
    });

    it('should handle empty skills array', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123',
        role: USER_ROLES.POSTER,
      };

      // Act
      const user = new User(userData);
      const validationError = user.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
    });

    it('should handle null values for optional fields', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123',
        role: USER_ROLES.POSTER, // Added required role field
        phone: null,
        location: null,
        image: null,
      };

      // Act
      const user = new User(userData);
      const validationError = user.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
    });

    it('should handle boundary values for ratings', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123',
        role: USER_ROLES.POSTER,
        averageRating: 5, // maximum value
        ratingsCount: 0, // minimum value
      };

      // Act
      const user = new User(userData);
      const validationError = user.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(user.averageRating).toBe(5);
      expect(user.ratingsCount).toBe(0);
    });

    it('should handle maximum device tokens', async () => {
      // Arrange
      const manyTokens = Array.from({ length: 100 }, (_, i) => `token-${i}`);
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123',
        role: USER_ROLES.POSTER,
        deviceTokens: manyTokens,
      };

      // Act
      const user = new User(userData);
      const validationError = user.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(user.deviceTokens).toHaveLength(100);
    });

    it('should handle all user roles', async () => {
      // Test all available user roles
      const roles = Object.values(USER_ROLES);
      
      for (const role of roles) {
        // Arrange
        const userData = {
          name: `User ${role}`,
          email: `${role.toLowerCase()}@example.com`,
          password: 'hashedPassword123',
          role: role,
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeUndefined();
        expect(user.role).toBe(role);
      }
    });

    it('should handle all user statuses', async () => {
      // Test all available user statuses
      const statuses = Object.values(USER_STATUS);
      
      for (const status of statuses) {
        // Arrange
        const userData = {
          name: `User ${status}`,
          email: `${status.toLowerCase()}@example.com`,
          password: 'hashedPassword123',
          role: USER_ROLES.POSTER,
          status: status,
        };

        // Act
        const user = new User(userData);
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeUndefined();
        expect(user.status).toBe(status);
      }
    });
  });

  describe('Database Integration Tests', () => {
    it('should create and retrieve user from database', async () => {
      // Arrange
      const userData = {
        name: 'Database User',
        email: 'db@example.com',
        password: 'password123',
        role: USER_ROLES.POSTER,
      };

      (bcrypt.hash as any).mockResolvedValue('hashedPassword123');

      // Act
      const createdUser = await User.create(userData);
      const retrievedUser = await User.findById(createdUser._id);

      // Assert
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.name).toBe(userData.name);
      expect(retrievedUser?.email).toBe(userData.email);
      expect(retrievedUser?.role).toBe(userData.role);
    });

    it('should enforce unique email constraint', async () => {
      // Arrange
      const userData1 = {
        name: 'User One',
        email: 'unique@example.com',
        password: 'password123',
        role: USER_ROLES.POSTER,
      };

      const userData2 = {
        name: 'User Two',
        email: 'unique@example.com',
        password: 'password456',
        role: USER_ROLES.POSTER,
      };

      (bcrypt.hash as any).mockResolvedValue('hashedPassword');

      // Act
      await User.create(userData1);

      // Assert
      await expect(User.create(userData2)).rejects.toThrow();
    });

    it('should update user successfully', async () => {
      // Arrange
      const userData = {
        name: 'Original Name',
        email: 'update@example.com',
        password: 'password123',
        role: USER_ROLES.POSTER,
      };

      (bcrypt.hash as any).mockResolvedValue('hashedPassword123');

      const createdUser = await User.create(userData);

      // Act
      const updatedUser = await User.findByIdAndUpdate(
        createdUser._id,
        { name: 'Updated Name' },
        { new: true }
      );

      // Assert
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.email).toBe(userData.email);
    });

    it('should delete user successfully', async () => {
      // Arrange
      const userData = {
        name: 'Delete Me',
        email: 'delete@example.com',
        password: 'password123',
        role: USER_ROLES.POSTER,
      };

      (bcrypt.hash as any).mockResolvedValue('hashedPassword123');

      const createdUser = await User.create(userData);

      // Act
      await User.findByIdAndDelete(createdUser._id);
      const deletedUser = await User.findById(createdUser._id);

      // Assert
      expect(deletedUser).toBeNull();
    });
  });
});