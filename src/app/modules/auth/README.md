# Auth Module

The Auth module handles all authentication-related functionality for the Task Titans application, including user login, email verification, password management, and security features.

## 📁 Module Structure

```
auth/
├── auth.controller.ts    # Request handlers for auth endpoints
├── auth.route.ts         # Route definitions and middleware
├── auth.service.ts       # Business logic for authentication
├── auth.validation.ts    # Input validation schemas
└── README.md            # This documentation
```

## 🔐 Features

### Core Authentication
- **User Login**: Secure login with email and password
- **Email Verification**: OTP-based email verification system
- **Password Management**: Forget password, reset password, and change password functionality
- **JWT Token Management**: Secure token generation and validation
- **Account Security**: Account status and verification checks

## 🛠 API Endpoints

### POST `/auth/login`
Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged in successfully.",
  "data": "jwt_token_here"
}
```

### POST `/auth/verify-email`
Verify user email with OTP code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "oneTimeCode": 123456
}
```

### POST `/auth/forget-password`
Initiate password reset process.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### POST `/auth/reset-password`
Reset password using reset token.

**Headers:**
```
Authorization: Bearer <reset_token>
```

**Request Body:**
```json
{
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

### POST `/auth/change-password`
Change password for authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "currentPassword123",
  "newPassword": "newPassword123"
}
```

## 🔧 Service Methods

### `loginUserFromDB(payload: ILoginData)`
- Validates user credentials
- Checks account verification and status
- Generates JWT access token
- Returns authentication token

### `verifyEmailToDB(payload: IVerifyEmail)`
- Validates OTP code
- Updates user verification status
- Handles email verification process

### `forgetPasswordToDB(email: string)`
- Generates reset token
- Sends password reset email
- Creates reset token record

### `resetPasswordToDB(token: string, payload: IAuthResetPassword)`
- Validates reset token
- Updates user password
- Invalidates reset token

### `changePasswordToDB(user: JwtPayload, payload: IChangePassword)`
- Validates current password
- Updates to new password
- Maintains security checks

## 🛡️ Security Features

- **Password Hashing**: Uses bcrypt for secure password storage
- **JWT Tokens**: Secure token-based authentication
- **OTP Verification**: Email-based one-time password system
- **Account Status Checks**: Prevents access for deactivated accounts
- **Password Validation**: Enforces strong password requirements
- **Rate Limiting**: Protection against brute force attacks

## 📧 Email Integration

- **Verification Emails**: Automated OTP delivery for account verification
- **Password Reset**: Secure password reset link generation
- **Email Templates**: Consistent, branded email communications

## 🔗 Dependencies

- **bcrypt**: Password hashing and comparison
- **jsonwebtoken**: JWT token generation and validation
- **http-status-codes**: Standardized HTTP status codes
- **crypto**: Secure token generation
- **nodemailer**: Email delivery service

## 🚨 Error Handling

- **Invalid Credentials**: Returns appropriate error for wrong email/password
- **Unverified Account**: Blocks login for unverified users
- **Deactivated Account**: Prevents access for deleted accounts
- **Expired Tokens**: Handles token expiration gracefully
- **Invalid OTP**: Validates one-time passwords

## 📝 Validation

- **Email Format**: Validates proper email structure
- **Password Strength**: Enforces minimum password requirements
- **OTP Format**: Validates 6-digit numeric codes
- **Token Format**: Validates JWT token structure

## 🔄 Related Modules

- **User Module**: User account management
- **ResetToken Module**: Password reset token management
- **Email Helper**: Email delivery functionality
- **JWT Helper**: Token management utilities

## 📊 Usage Examples

### Login Flow
```typescript
// 1. User submits login credentials
const loginData = {
  email: 'user@example.com',
  password: 'userPassword123'
};

// 2. Service validates and returns token
const result = await AuthService.loginUserFromDB(loginData);

// 3. Client receives JWT token for subsequent requests
```

### Password Reset Flow
```typescript
// 1. User requests password reset
await AuthService.forgetPasswordToDB('user@example.com');

// 2. User receives email with reset link
// 3. User submits new password with reset token
const resetData = {
  newPassword: 'newPassword123',
  confirmPassword: 'newPassword123'
};

await AuthService.resetPasswordToDB(resetToken, resetData);
```

This module ensures secure and reliable authentication for the Task Titans platform, providing a robust foundation for user security and access management.