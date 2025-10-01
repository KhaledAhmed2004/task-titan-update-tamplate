# User Module

The User module is a fundamental component of the Task Titans application, managing user accounts, profiles, authentication, and user-related operations throughout the platform.

## 📁 Module Structure

```
user/
├── user.controller.ts    # Request handlers for user endpoints
├── user.interface.ts     # TypeScript interfaces and types
├── user.model.ts         # MongoDB schema and model
├── user.route.ts         # Route definitions and middleware
├── user.service.ts       # Business logic for user operations
├── user.validation.ts    # Input validation schemas
└── README.md            # This documentation
```

## 🎯 Features

### Core User Management
- **User Registration**: Create new user accounts with email verification
- **Profile Management**: View and update user profiles
- **Image Upload**: Profile picture upload and management
- **Account Verification**: Email-based account verification system
- **Role-Based Access**: Support for different user roles (USER, ADMIN, SUPER_ADMIN)
- **Account Status**: Active/inactive account management
- **Location Tracking**: User location for task matching

### Security Features
- **Email Verification**: OTP-based email verification
- **Password Security**: Secure password hashing and validation
- **Account Status Management**: Active/delete status tracking
- **Role-Based Authorization**: Different permission levels
- **Authentication Integration**: JWT token-based authentication

## 🛠 API Endpoints

### POST `/users`
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "contact": "+1234567890",
  "location": "New York, NY"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User created successfully",
  "data": {
    "_id": "64f123abc456def789012345",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "contact": "+1234567890",
    "location": "New York, NY",
    "role": "USER",
    "status": "active",
    "verified": false,
    "createdAt": "2025-08-23T10:00:00Z",
    "updatedAt": "2025-08-23T10:00:00Z"
  }
}
```

### GET `/users/profile`
Get the current user's profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile data retrieved successfully",
  "data": {
    "_id": "64f123abc456def789012345",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "contact": "+1234567890",
    "location": "New York, NY",
    "image": "https://example.com/profile-images/john-doe.jpg",
    "role": "USER",
    "status": "active",
    "verified": true,
    "createdAt": "2025-08-23T10:00:00Z",
    "updatedAt": "2025-08-23T12:00:00Z"
  }
}
```

### PUT `/users/profile`
Update the current user's profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
name: "John Smith"
contact: "+1234567891"
location: "Los Angeles, CA"
image: [file upload]
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "_id": "64f123abc456def789012345",
    "name": "John Smith",
    "email": "john.doe@example.com",
    "contact": "+1234567891",
    "location": "Los Angeles, CA",
    "image": "https://example.com/profile-images/john-smith.jpg",
    "role": "USER",
    "status": "active",
    "verified": true,
    "updatedAt": "2025-08-23T14:00:00Z"
  }
}
```

## 🔧 Service Methods

### `createUserToDB(payload: Partial<IUser>)`
- Creates a new user account in the database
- Automatically sets role to 'USER'
- Generates and sends email verification OTP
- Sets up authentication object with OTP and expiration
- Returns created user object

### `getUserProfileFromDB(user: JwtPayload)`
- Retrieves user profile information
- Validates user existence by ID
- Returns user profile data (excluding sensitive information)
- Throws error if user doesn't exist

### `updateProfileToDB(user: JwtPayload, payload: Partial<IUser>)`
- Updates user profile information
- Handles image upload and file management
- Validates user existence before update
- Returns updated user profile
- Manages old image file cleanup

## 📊 Data Types

### IUser Interface
```typescript
type IUser = {
  name: string;              // Full name of the user
  role: USER_ROLES;          // User role (USER, ADMIN, SUPER_ADMIN)
  contact: string;           // Phone number or contact information
  email: string;             // Email address (unique)
  password: string;          // Hashed password
  location: string;          // Geographic location
  image?: string;            // Profile image URL (optional)
  status: 'active' | 'delete'; // Account status
  verified: boolean;         // Email verification status
  authentication?: {         // Authentication-related data
    isResetPassword: boolean;
    oneTimeCode: number;     // OTP for verification
    expireAt: Date;          // OTP expiration time
  };
};
```

### UserModal Interface
```typescript
type UserModal = {
  isExistUserById(id: string): any;           // Check user existence by ID
  isExistUserByEmail(email: string): any;     // Check user existence by email
  isMatchPassword(password: string, hashPassword: string): boolean; // Password validation
} & Model<IUser>;
```

### User Roles
```typescript
enum USER_ROLES {
  SUPER_ADMIN = 'SUPER_ADMIN',  // Highest level access
  ADMIN = 'ADMIN',              // Administrative access
  USER = 'USER',                // Standard user access
}
```

## 🔄 User Lifecycle

1. **Registration**: User creates account with basic information
2. **Email Verification**: OTP sent to user's email for verification
3. **Account Activation**: User verifies email and activates account
4. **Profile Setup**: User completes profile with additional information
5. **Active Usage**: User can create tasks, bid on tasks, and use platform
6. **Profile Updates**: User can modify profile information and image
7. **Account Management**: Admin can manage user status and roles

## 🔐 Authentication & Authorization

### Email Verification Process
1. User registers with email and password
2. System generates 6-digit OTP
3. OTP sent to user's email address
4. OTP expires after 3 minutes
5. User enters OTP to verify account
6. Account status changes to verified

### Role-Based Access Control
- **USER**: Can create tasks, bid on tasks, manage own profile
- **ADMIN**: Can manage users, moderate content, access admin features
- **SUPER_ADMIN**: Full system access, can manage admins and system settings

### Security Features
- Password hashing using bcrypt
- JWT token-based authentication
- OTP-based email verification
- Account status management
- Secure file upload handling

## 🖼️ Image Management

### Profile Image Upload
- Supports common image formats (JPG, PNG, GIF)
- Automatic file path generation
- Old image cleanup when updating
- Secure file storage
- Image URL generation for frontend access

### File Handling
- Multer middleware for file uploads
- File validation and size limits
- Automatic file cleanup on profile updates
- Error handling for upload failures

## 🔗 Related Modules

- **Auth Module**: Handles login, logout, and password management
- **Task Module**: Users create and manage tasks
- **Bid Module**: Users bid on tasks
- **Rating Module**: Users rate each other after task completion
- **Notification Module**: Users receive notifications
- **Payment Module**: Users manage payments and earnings

## 🛡️ Security & Validation

### Input Validation
- Email format validation
- Password strength requirements
- Phone number format validation
- Name length and character validation
- Location format validation

### Data Security
- Password hashing before storage
- Sensitive data exclusion from responses
- JWT token validation for protected routes
- File upload security measures
- SQL injection prevention

### Privacy Protection
- Password never returned in responses
- Authentication data excluded from public profiles
- Secure file storage and access
- User data anonymization options

## 📝 Business Rules

### Account Creation
- Email addresses must be unique
- All required fields must be provided
- Default role is set to 'USER'
- Account starts as unverified
- Email verification required for full access

### Profile Management
- Users can only update their own profiles
- Email changes require re-verification
- Image uploads have size and format restrictions
- Location updates affect task matching

### Account Status
- Only active accounts can use the platform
- Deleted accounts retain data for audit purposes
- Admins can change user status
- Status changes trigger appropriate notifications

## 🚨 Error Handling

### Common Errors
- **User Not Found**: Returns 400 when user doesn't exist
- **Duplicate Email**: Returns 400 for existing email addresses
- **Invalid Credentials**: Returns 401 for authentication failures
- **Unauthorized Access**: Returns 403 for insufficient permissions
- **Validation Errors**: Returns 400 for invalid input data
- **File Upload Errors**: Returns 400 for upload failures

### Error Response Format
```json
{
  "success": false,
  "statusCode": 400,
  "message": "User doesn't exist!",
  "errorMessages": [
    {
      "path": "id",
      "message": "Invalid user ID provided"
    }
  ]
}
```

## 📧 Email Integration

### Email Templates
- **Account Creation**: Welcome email with verification OTP
- **Password Reset**: Password reset instructions
- **Profile Updates**: Confirmation of profile changes
- **Account Status**: Notifications about account status changes

### Email Helper Functions
- Template generation with dynamic content
- SMTP configuration and sending
- Error handling for email failures
- Retry mechanisms for failed sends

## 📊 Usage Examples

### Creating a User
```typescript
const userData = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  password: 'securePassword123',
  contact: '+1987654321',
  location: 'Chicago, IL'
};

const result = await UserService.createUserToDB(userData);
```

### Getting User Profile
```typescript
const user = req.user; // From JWT token
const profile = await UserService.getUserProfileFromDB(user);
```

### Updating Profile with Image
```typescript
const user = req.user;
const updateData = {
  name: 'Jane Doe',
  location: 'Miami, FL',
  image: '/uploads/profiles/jane-doe.jpg'
};

const result = await UserService.updateProfileToDB(user, updateData);
```

### Checking User Existence
```typescript
const userExists = await User.isExistUserById('64f123abc456def789012345');
const emailExists = await User.isExistUserByEmail('jane@example.com');
```

### Password Validation
```typescript
const isValidPassword = await User.isMatchPassword(
  'userInputPassword',
  'hashedPasswordFromDB'
);
```

This module serves as the foundation for user management in the Task Titans platform, providing secure account creation, profile management, and authentication integration while maintaining data integrity and user privacy.