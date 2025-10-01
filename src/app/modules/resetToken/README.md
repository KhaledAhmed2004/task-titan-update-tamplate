# Reset Token Module

## Overview

The Reset Token module manages password reset functionality for Task Titans. It handles the generation, validation, and expiration of secure tokens used in the password reset process, ensuring secure and time-limited password recovery for users.

## Features

- ✅ **Secure Token Generation**: Generate cryptographically secure reset tokens
- ✅ **Token Expiration**: Automatic token expiration for security
- ✅ **Token Validation**: Verify token existence and validity
- ✅ **Single Use Tokens**: Tokens are invalidated after use
- ✅ **User Association**: Link tokens to specific user accounts
- ✅ **Cleanup Mechanism**: Automatic cleanup of expired tokens
- ✅ **Rate Limiting**: Prevent token generation abuse

## Token Lifecycle

```
Password Reset Request → Token Generation → Email Sent → Token Validation → Password Reset → Token Deletion
```

## API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/forgot-password` | Request password reset token |
| `POST` | `/api/auth/reset-password` | Reset password using token |
| `GET` | `/api/auth/verify-reset-token/:token` | Verify token validity |

### Admin Endpoints (Requires Admin Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/reset-tokens` | Get all reset tokens |
| `DELETE` | `/api/admin/reset-tokens/:id` | Delete specific reset token |
| `DELETE` | `/api/admin/reset-tokens/cleanup` | Cleanup expired tokens |
| `GET` | `/api/admin/reset-tokens/stats` | Get reset token statistics |

## Data Models

### Reset Token Interface

```typescript
export type IResetToken = {
  _id?: Types.ObjectId;
  user: Types.ObjectId;            // User requesting password reset
  token: string;                   // Secure reset token
  expireAt: Date;                  // Token expiration date
  isUsed?: boolean;                // Whether token has been used
  usedAt?: Date;                   // When token was used
  ipAddress?: string;              // IP address of requester
  userAgent?: string;              // User agent of requester
  createdAt?: Date;
  updatedAt?: Date;
}

export type ResetTokenModel = Model<IResetToken, Record<string, unknown>> & {
  isExistToken(token: string): Promise<IResetToken | null>;
  isExpireToken(token: string): Promise<boolean>;
};
```

### Token Generation Options

```typescript
interface TokenGenerationOptions {
  length?: number;                 // Token length (default: 32)
  expirationMinutes?: number;      // Expiration time in minutes (default: 60)
  includeMetadata?: boolean;       // Include IP and user agent
  reuseExisting?: boolean;         // Reuse existing valid token
}
```

### Request/Response Examples

#### Request Password Reset

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset email sent successfully",
  "data": {
    "email": "user@example.com",
    "tokenSent": true,
    "expiresIn": "60 minutes"
  }
}
```

#### Verify Reset Token

**Request:**
```
GET /api/auth/verify-reset-token/abc123def456ghi789jkl012mno345pq
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Token is valid",
  "data": {
    "valid": true,
    "user": {
      "_id": "507f1f77bcf86cd799439015",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "expiresAt": "2024-01-15T17:30:00.000Z",
    "timeRemaining": "45 minutes"
  }
}
```

#### Reset Password

**Request:**
```json
{
  "token": "abc123def456ghi789jkl012mno345pq",
  "newPassword": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successfully",
  "data": {
    "passwordReset": true,
    "user": {
      "_id": "507f1f77bcf86cd799439015",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "tokenUsed": true
  }
}
```

#### Get Reset Token Statistics (Admin)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Reset token statistics retrieved successfully",
  "data": {
    "totalTokens": 1247,
    "activeTokens": 23,
    "expiredTokens": 1156,
    "usedTokens": 1068,
    "todayRequests": 45,
    "weeklyRequests": 312,
    "monthlyRequests": 1247,
    "averageUsageTime": "12 minutes",
    "topRequestHours": [9, 14, 16, 20],
    "successRate": 0.86
  }
}
```

## Service Methods

### Core Operations

- `generateResetToken(userId, options?)` - Generate new reset token
- `validateToken(token)` - Validate token existence and expiration
- `useToken(token, newPassword)` - Use token to reset password
- `getTokenByValue(token)` - Get token details by token value
- `deleteToken(tokenId)` - Delete specific token
- `deleteUserTokens(userId)` - Delete all tokens for a user

### Utility Methods

- `isTokenExpired(token)` - Check if token is expired
- `isTokenUsed(token)` - Check if token has been used
- `getTokenTimeRemaining(token)` - Get remaining time for token
- `cleanupExpiredTokens()` - Remove expired tokens
- `getUserActiveTokens(userId)` - Get active tokens for user

### Statistics and Analytics

- `getResetTokenStats(dateRange?)` - Get token usage statistics
- `getTokenUsageByHour()` - Get usage patterns by hour
- `getSuccessRate(dateRange?)` - Get password reset success rate
- `getTopRequestIPs(limit?)` - Get top requesting IP addresses

## Database Schema

```javascript
const resetTokenSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expireAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true
  },
  usedAt: {
    type: Date
  },
  ipAddress: {
    type: String,
    validate: {
      validator: function(ip) {
        // Basic IP validation
        return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip);
      },
      message: 'Invalid IP address format'
    }
  },
  userAgent: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
resetTokenSchema.index({ user: 1, createdAt: -1 });
resetTokenSchema.index({ expireAt: 1, isUsed: 1 });
resetTokenSchema.index({ createdAt: -1 });

// Static method to check if token exists
resetTokenSchema.statics.isExistToken = function(token: string) {
  return this.findOne({ 
    token, 
    expireAt: { $gt: new Date() }, 
    isUsed: false 
  }).populate('user', 'email name');
};

// Static method to check if token is expired
resetTokenSchema.statics.isExpireToken = function(token: string) {
  return this.findOne({ token })
    .then(tokenDoc => {
      if (!tokenDoc) return true;
      return tokenDoc.expireAt < new Date() || tokenDoc.isUsed;
    });
};

// Pre-save middleware to generate secure token
resetTokenSchema.pre('save', function() {
  if (this.isNew && !this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
});

// Pre-save middleware to set expiration
resetTokenSchema.pre('save', function() {
  if (this.isNew && !this.expireAt) {
    this.expireAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  }
});

// Mark as used when usedAt is set
resetTokenSchema.pre('save', function() {
  if (this.usedAt && !this.isUsed) {
    this.isUsed = true;
  }
});
```

## Business Rules

### Token Generation

1. **User Validation**: Only valid, active users can request reset tokens
2. **Rate Limiting**: Maximum 3 reset requests per hour per user
3. **Token Uniqueness**: Each token must be cryptographically unique
4. **Expiration Time**: Tokens expire after 60 minutes by default
5. **Single Active Token**: Only one active token per user at a time

### Token Usage

1. **Single Use**: Tokens can only be used once
2. **Expiration Check**: Expired tokens cannot be used
3. **User Match**: Token must belong to the user attempting reset
4. **Password Validation**: New password must meet security requirements
5. **Immediate Invalidation**: Token is invalidated immediately after use

### Security Measures

1. **Secure Generation**: Use cryptographically secure random generation
2. **No Token Storage**: Don't store tokens in logs or responses
3. **IP Tracking**: Track IP addresses for security monitoring
4. **Automatic Cleanup**: Remove expired tokens automatically
5. **Audit Trail**: Log all token generation and usage events

## Error Handling

Common error scenarios:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found with provided email"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Invalid or expired reset token"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Reset token has already been used"
}

{
  "success": false,
  "statusCode": 429,
  "message": "Too many reset requests. Please try again later"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Password confirmation does not match"
}

{
  "success": false,
  "statusCode": 400,
  "message": "New password does not meet security requirements"
}
```

## Usage Examples

### Generating a Reset Token

```typescript
import { ResetTokenService } from './resetToken.service';
import { EmailService } from '../email/email.service';

const generatePasswordResetToken = async (email: string, ipAddress: string, userAgent: string) => {
  try {
    // Find user by email
    const user = await UserService.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token
    const tokenData = await ResetTokenService.generateResetToken(user._id, {
      expirationMinutes: 60,
      includeMetadata: true,
      ipAddress,
      userAgent
    });

    // Send reset email
    await EmailService.sendPasswordResetEmail(user.email, {
      name: user.name,
      resetToken: tokenData.token,
      expiresAt: tokenData.expireAt
    });

    return { success: true, tokenSent: true };
  } catch (error) {
    console.error('Failed to generate reset token:', error.message);
    throw error;
  }
};
```

### Validating a Reset Token

```typescript
const validateResetToken = async (token: string) => {
  try {
    const tokenDoc = await ResetTokenService.validateToken(token);
    
    if (!tokenDoc) {
      return { valid: false, reason: 'Token not found or expired' };
    }

    if (tokenDoc.isUsed) {
      return { valid: false, reason: 'Token has already been used' };
    }

    const timeRemaining = tokenDoc.expireAt.getTime() - Date.now();
    if (timeRemaining <= 0) {
      return { valid: false, reason: 'Token has expired' };
    }

    return {
      valid: true,
      user: tokenDoc.user,
      expiresAt: tokenDoc.expireAt,
      timeRemaining: Math.floor(timeRemaining / (1000 * 60)) // minutes
    };
  } catch (error) {
    console.error('Token validation error:', error.message);
    return { valid: false, reason: 'Validation error' };
  }
};
```

### Using Token to Reset Password

```typescript
const resetPassword = async (token: string, newPassword: string, confirmPassword: string) => {
  try {
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new Error('Password confirmation does not match');
    }

    // Validate token and get user
    const tokenDoc = await ResetTokenService.validateToken(token);
    if (!tokenDoc) {
      throw new Error('Invalid or expired reset token');
    }

    // Reset password
    await UserService.updatePassword(tokenDoc.user._id, newPassword);

    // Mark token as used
    await ResetTokenService.useToken(token);

    // Send confirmation email
    await EmailService.sendPasswordResetConfirmation(tokenDoc.user.email, {
      name: tokenDoc.user.name,
      resetTime: new Date()
    });

    return { success: true, passwordReset: true };
  } catch (error) {
    console.error('Password reset error:', error.message);
    throw error;
  }
};
```

### Cleanup Expired Tokens

```typescript
const cleanupExpiredTokens = async () => {
  try {
    const result = await ResetTokenService.cleanupExpiredTokens();
    console.log(`Cleaned up ${result.deletedCount} expired tokens`);
    return result;
  } catch (error) {
    console.error('Cleanup error:', error.message);
    throw error;
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
```

## Integration Points

### With User Module
- Validate user existence for token generation
- Update user passwords after successful reset
- Handle user account status checks
- Track password reset history

### With Email Module
- Send password reset emails with tokens
- Send confirmation emails after reset
- Handle email delivery failures
- Template management for reset emails

### With Auth Module
- Integrate with authentication flow
- Handle login after password reset
- Manage session invalidation
- Security event logging

### With Notification Module
- Send in-app notifications for reset requests
- Alert users about successful password changes
- Notify about suspicious reset attempts

## Security Considerations

### Token Security

1. **Cryptographic Strength**: Use crypto.randomBytes() for token generation
2. **Token Length**: Minimum 32 characters for adequate entropy
3. **No Predictable Patterns**: Avoid sequential or time-based tokens
4. **Secure Transmission**: Always use HTTPS for token URLs
5. **No Token Logging**: Never log tokens in application logs

### Rate Limiting

```typescript
interface RateLimitConfig {
  maxRequests: number;     // Maximum requests per window
  windowMinutes: number;   // Time window in minutes
  blockDuration: number;   // Block duration in minutes
}

const rateLimitConfig: RateLimitConfig = {
  maxRequests: 3,
  windowMinutes: 60,
  blockDuration: 60
};
```

### Monitoring and Alerts

```typescript
interface SecurityAlert {
  type: 'EXCESSIVE_REQUESTS' | 'SUSPICIOUS_IP' | 'TOKEN_ABUSE';
  userId?: string;
  ipAddress: string;
  timestamp: Date;
  details: object;
}
```

## Performance Considerations

1. **Indexing**: 
   - Index on token field for fast lookups
   - Index on user and expiration for cleanup
   - TTL index for automatic expiration

2. **Cleanup Strategy**: 
   - Automatic MongoDB TTL expiration
   - Periodic cleanup of used tokens
   - Batch deletion for performance

3. **Caching**: 
   - Cache rate limit counters
   - Cache user lookup results
   - Avoid caching sensitive token data

4. **Database Optimization**: 
   - Use lean queries for token validation
   - Minimize populated fields
   - Efficient aggregation for statistics

## Monitoring and Analytics

### Key Metrics

- Token generation rate
- Token usage success rate
- Average time between generation and usage
- Failed validation attempts
- Top requesting IP addresses
- Peak usage hours

### Alerting Thresholds

- Excessive requests from single IP
- High failure rates
- Unusual usage patterns
- Token abuse attempts

## Future Enhancements

- [ ] Multi-factor authentication for password reset
- [ ] SMS-based reset tokens as alternative
- [ ] Geolocation-based security checks
- [ ] Advanced rate limiting with user reputation
- [ ] Token usage analytics dashboard
- [ ] Automated security incident response
- [ ] Integration with external security services
- [ ] Custom token expiration policies
- [ ] Backup recovery methods
- [ ] Enhanced audit logging
- [ ] Machine learning for fraud detection
- [ ] Progressive security challenges