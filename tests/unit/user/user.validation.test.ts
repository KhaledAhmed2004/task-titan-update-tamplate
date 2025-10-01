import { describe, it, expect } from 'vitest';
import { UserValidation } from '../../../src/app/modules/user/user.validation';

describe('User Validation', () => {
  describe('createUserZodSchema', () => {
    describe('Valid Input Cases', () => {
      it('should validate with all required fields', () => {
        // Arrange
        const validUserData = {
          body: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            password: 'password123',
          },
        };

        // Act
        const result =
          UserValidation.createUserZodSchema.safeParse(validUserData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body.name).toBe('John Doe');
          expect(result.data.body.email).toBe('john.doe@example.com');
          expect(result.data.body.password).toBe('password123');
        }
      });

      it('should validate with all fields including optional ones', () => {
        // Arrange
        const completeUserData = {
          body: {
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            password: 'securePassword123',
            gender: 'female' as const,
            dateOfBirth: '1990-01-01',
            location: 'New York, NY',
            phone: '+1234567890',
            image: 'https://example.com/profile.jpg',
          },
        };

        // Act
        const result =
          UserValidation.createUserZodSchema.safeParse(completeUserData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body.name).toBe('Jane Smith');
          expect(result.data.body.email).toBe('jane.smith@example.com');
          expect(result.data.body.gender).toBe('female');
          expect(result.data.body.dateOfBirth).toBe('1990-01-01');
          expect(result.data.body.location).toBe('New York, NY');
          expect(result.data.body.phone).toBe('+1234567890');
          expect(result.data.body.image).toBe(
            'https://example.com/profile.jpg'
          );
        }
      });

      it('should validate with minimum password length (8 characters)', () => {
        // Arrange
        const userData = {
          body: {
            name: 'Test User',
            email: 'test@example.com',
            password: '12345678', // exactly 8 characters
          },
        };

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(true);
      });

      it('should validate with male gender', () => {
        // Arrange
        const userData = {
          body: {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            gender: 'male' as const,
          },
        };

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body.gender).toBe('male');
        }
      });
    });

    describe('Invalid Input Cases - Missing Required Fields', () => {
      it('should fail when name is missing', () => {
        // Arrange
        const userData = {
          body: {
            email: 'test@example.com',
            password: 'password123',
          },
        };

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(1);
          expect(result.error.issues[0].path).toEqual(['body', 'name']);
          expect(result.error.issues[0].message).toBe('Name is required');
        }
      });

      it('should fail when email is missing', () => {
        // Arrange
        const userData = {
          body: {
            name: 'John Doe',
            password: 'password123',
          },
        };

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(1);
          expect(result.error.issues[0].path).toEqual(['body', 'email']);
          expect(result.error.issues[0].message).toBe('Email is required');
        }
      });

      it('should fail when password is missing', () => {
        // Arrange
        const userData = {
          body: {
            name: 'John Doe',
            email: 'test@example.com',
          },
        };

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(1);
          expect(result.error.issues[0].path).toEqual(['body', 'password']);
        }
      });

      it('should fail when all required fields are missing', () => {
        // Arrange
        const userData = {
          body: {},
        };

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(3); // name, email, password
          const paths = result.error.issues.map(issue => issue.path[1]);
          expect(paths).toContain('name');
          expect(paths).toContain('email');
          expect(paths).toContain('password');
        }
      });
    });

    describe('Invalid Input Cases - Field Validation', () => {
      it('should fail when password is too short (less than 8 characters)', () => {
        // Arrange
        const userData = {
          body: {
            name: 'John Doe',
            email: 'test@example.com',
            password: '1234567', // 7 characters
          },
        };

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(1);
          expect(result.error.issues[0].path).toEqual(['body', 'password']);
          expect(result.error.issues[0].message).toBe(
            'Password must be at least 8 characters long'
          );
        }
      });

      it('should fail when gender is invalid', () => {
        // Arrange
        const userData = {
          body: {
            name: 'John Doe',
            email: 'test@example.com',
            password: 'password123',
            gender: 'other' as any, // invalid gender
          },
        };

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(1);
          expect(result.error.issues[0].path).toEqual(['body', 'gender']);
        }
      });

      it('should allow empty string for name (no min length validation)', () => {
        // Arrange
        const userData = {
          body: {
            name: '',
            email: 'test@example.com',
            password: 'password123',
          },
        };

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body.name).toBe('');
        }
      });

      it('should allow empty string for email (no email format validation)', () => {
        // Arrange
        const userData = {
          body: {
            name: 'John Doe',
            email: '',
            password: 'password123',
          },
        };

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body.email).toBe('');
        }
      });
    });

    describe('Edge Cases', () => {
      it('should fail when body is missing', () => {
        // Arrange
        const userData = {};

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(1);
          expect(result.error.issues[0].path).toEqual(['body']);
        }
      });

      it('should fail when input is null', () => {
        // Arrange
        const userData = null;

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(false);
      });

      it('should fail when input is undefined', () => {
        // Arrange
        const userData = undefined;

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(false);
      });

      it('should handle very long password', () => {
        // Arrange
        const longPassword = 'a'.repeat(1000);
        const userData = {
          body: {
            name: 'John Doe',
            email: 'test@example.com',
            password: longPassword,
          },
        };

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body.password).toBe(longPassword);
        }
      });

      it('should handle special characters in name', () => {
        // Arrange
        const userData = {
          body: {
            name: "John O'Connor-Smith Jr.",
            email: 'test@example.com',
            password: 'password123',
          },
        };

        // Act
        const result = UserValidation.createUserZodSchema.safeParse(userData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body.name).toBe("John O'Connor-Smith Jr.");
        }
      });
    });
  });

  describe('updateUserZodSchema', () => {
    describe('Valid Input Cases', () => {
      it('should validate with no fields (all optional)', () => {
        // Arrange
        const updateData = {};

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(true);
      });

      it('should validate with single field update', () => {
        // Arrange
        const updateData = {
          name: 'Updated Name',
        };

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('Updated Name');
        }
      });

      it('should validate with multiple field updates', () => {
        // Arrange
        const updateData = {
          name: 'Jane Doe',
          email: 'jane.updated@example.com',
          location: 'Los Angeles, CA',
          phone: '+1987654321',
        };

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('Jane Doe');
          expect(result.data.email).toBe('jane.updated@example.com');
          expect(result.data.location).toBe('Los Angeles, CA');
          expect(result.data.phone).toBe('+1987654321');
        }
      });

      it('should validate with all possible fields', () => {
        // Arrange
        const updateData = {
          name: 'Complete Update',
          email: 'complete@example.com',
          gender: 'male' as const,
          dateOfBirth: '1985-12-25',
          location: 'Chicago, IL',
          phone: '+1555123456',
          password: 'newPassword123',
          image: 'https://example.com/new-profile.jpg',
        };

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('Complete Update');
          expect(result.data.email).toBe('complete@example.com');
          expect(result.data.gender).toBe('male');
          expect(result.data.dateOfBirth).toBe('1985-12-25');
          expect(result.data.location).toBe('Chicago, IL');
          expect(result.data.phone).toBe('+1555123456');
          expect(result.data.password).toBe('newPassword123');
          expect(result.data.image).toBe('https://example.com/new-profile.jpg');
        }
      });

      it('should validate gender update to female', () => {
        // Arrange
        const updateData = {
          gender: 'female' as const,
        };

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.gender).toBe('female');
        }
      });
    });

    describe('Invalid Input Cases', () => {
      it('should fail with invalid gender', () => {
        // Arrange
        const updateData = {
          gender: 'non-binary' as any, // invalid gender
        };

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(1);
          expect(result.error.issues[0].path).toEqual(['gender']);
        }
      });

      it('should allow empty string for name (no validation rules)', () => {
        // Arrange
        const updateData = {
          name: '',
        };

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('');
        }
      });

      it('should allow empty string for email (no validation rules)', () => {
        // Arrange
        const updateData = {
          email: '',
        };

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe('');
        }
      });

      it('should fail with wrong data types', () => {
        // Arrange
        const updateData = {
          name: 123, // should be string
          email: true, // should be string
          gender: 'invalid', // should be 'male' or 'female'
        };

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0);
          const paths = result.error.issues.map(issue => issue.path[0]);
          expect(paths).toContain('name');
          expect(paths).toContain('email');
          expect(paths).toContain('gender');
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle null input', () => {
        // Arrange
        const updateData = null;

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(false);
      });

      it('should handle undefined input', () => {
        // Arrange
        const updateData = undefined;

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(false);
      });

      it('should handle array input', () => {
        // Arrange
        const updateData = [];

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(false);
      });

      it('should handle string input instead of object', () => {
        // Arrange
        const updateData = 'invalid input';

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(false);
      });

      it('should handle very long strings', () => {
        // Arrange
        const longString = 'a'.repeat(10000);
        const updateData = {
          name: longString,
          location: longString,
        };

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe(longString);
          expect(result.data.location).toBe(longString);
        }
      });

      it('should handle special characters and unicode', () => {
        // Arrange
        const updateData = {
          name: '张三 José María Ñoño',
          location: 'São Paulo, Brasil 🇧🇷',
        };

        // Act
        const result = UserValidation.updateUserZodSchema.safeParse(updateData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('张三 José María Ñoño');
          expect(result.data.location).toBe('São Paulo, Brasil 🇧🇷');
        }
      });
    });
  });
});
