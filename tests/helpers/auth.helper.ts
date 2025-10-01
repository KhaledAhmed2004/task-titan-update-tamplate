import request from 'supertest';

// Configuration constants
export const BACKEND_URL = 'http://10.10.7.33:5000';
export const API_BASE = '/api/v1';

export interface AuthenticatedUser {
  _id: string;
  email: string;
  name: string;
  role: string;
  token: string;
}

export interface TestUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  location?: string;
  phone?: string;
}

/**
 * Authenticate a user with the real backend
 * @param email - User email
 * @param password - User password
 * @returns JWT token
 */
export const authenticateWithRealBackend = async (email: string, password: string): Promise<string> => {
  const response = await request(BACKEND_URL)
    .post(`${API_BASE}/auth/login`)
    .send({ email, password });
  
  if (response.status === 200 && response.body.success) {
    return response.body.data; // JWT token
  }
  throw new Error(`Authentication failed: ${response.body?.message || 'Unknown error'}`);
};

/**
 * Request a new OTP for email verification
 * @param email - User email
 * @returns Success status
 */
export const requestVerificationOTP = async (email: string): Promise<string> => {
  const response = await request(BACKEND_URL)
    .post(`${API_BASE}/auth/resend-verify-email`)
    .send({ email });
  
  if (response.status === 200 && response.body.success) {
    // Extract OTP from response message if available
    const message = response.body.message || '';
    const otpMatch = message.match(/(\d{4})/);
    return otpMatch ? otpMatch[1] : '';
  }
  throw new Error(`Failed to request OTP: ${response.body?.message || 'Unknown error'}`);
};

/**
 * Verify user email with OTP
 * @param email - User email
 * @param otp - One-time password (as number)
 * @returns Success status
 */
export const verifyUserEmail = async (email: string, otp: number): Promise<boolean> => {
  const response = await request(BACKEND_URL)
    .post(`${API_BASE}/auth/verify-email`)
    .send({ email, oneTimeCode: otp });
  
  if (response.status === 200 && response.body.success) {
    return true;
  }
  throw new Error(`Email verification failed: ${response.body?.message || 'Unknown error'}`);
};

/**
 * Complete user verification process (request OTP and verify)
 * @param email - User email
 * @returns Success status
 */
export const completeUserVerification = async (email: string): Promise<boolean> => {
  try {
    // Request new OTP
    const otpString = await requestVerificationOTP(email);
    if (!otpString) {
      throw new Error('No OTP received');
    }
    
    const otp = parseInt(otpString, 10);
    
    // Verify with OTP
    return await verifyUserEmail(email, otp);
  } catch (error) {
    throw new Error(`Verification process failed for ${email}: ${error}`);
  }
};

/**
 * Create and authenticate a test user
 * @param userData - User data for creation
 * @returns Authenticated user with token
 */
export const createAndAuthenticateTestUser = async (userData: TestUserData): Promise<AuthenticatedUser> => {
  // First try to register the user
  const registerResponse = await request(BACKEND_URL)
    .post(`${API_BASE}/users`)
    .send(userData);
  
  let userId;
  if (registerResponse.status === 201) {
    userId = registerResponse.body.data._id;
  } else if (registerResponse.status === 400 && registerResponse.body.message?.includes('already exists')) {
    // User already exists, try to authenticate directly
    try {
      const token = await authenticateWithRealBackend(userData.email, userData.password);
      return {
        _id: userId || 'existing',
        email: userData.email,
        name: userData.name,
        role: userData.role,
        token
      };
    } catch (error) {
      // If authentication fails, user might need verification
      await completeUserVerification(userData.email);
      const token = await authenticateWithRealBackend(userData.email, userData.password);
      return {
        _id: userId || 'existing',
        email: userData.email,
        name: userData.name,
        role: userData.role,
        token
      };
    }
  } else {
    throw new Error(`User creation failed: ${registerResponse.body?.message || 'Unknown error'}`);
  }

  // If user was created, try to authenticate
  try {
    const token = await authenticateWithRealBackend(userData.email, userData.password);
    return {
      _id: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      token
    };
  } catch (error) {
    // If authentication fails, complete verification process
    await completeUserVerification(userData.email);
    const token = await authenticateWithRealBackend(userData.email, userData.password);
    return {
      _id: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      token
    };
  }
};

/**
 * Authenticate existing test users (poster, tasker1, tasker2)
 * @param email - User email
 * @param password - User password (defaults to 'password123')
 * @returns Authenticated user with token
 */
export const authenticateExistingTestUser = async (
  email: string, 
  password: string = 'password123'
): Promise<AuthenticatedUser> => {
  try {
    // Try direct authentication first
    const token = await authenticateWithRealBackend(email, password);
    
    // Extract user info from email (basic parsing)
    const role = email.includes('poster') ? 'POSTER' : 'TASKER';
    const name = email.split('@')[0];
    
    return {
      _id: 'existing',
      email,
      name,
      role,
      token
    };
  } catch (error) {
    // If authentication fails, try verification process
    await completeUserVerification(email);
    const token = await authenticateWithRealBackend(email, password);
    
    const role = email.includes('poster') ? 'POSTER' : 'TASKER';
    const name = email.split('@')[0];
    
    return {
      _id: 'existing',
      email,
      name,
      role,
      token
    };
  }
};

/**
 * Get authorization header for authenticated requests
 * @param token - JWT token
 * @returns Authorization header object
 */
export const getAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`
});

/**
 * Make authenticated request helper
 * @param method - HTTP method
 * @param endpoint - API endpoint
 * @param token - JWT token
 * @param data - Request data (optional)
 * @returns Supertest request
 */
export const makeAuthenticatedRequest = (
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  endpoint: string,
  token: string,
  data?: any
) => {
  const req = request(BACKEND_URL)[method](`${API_BASE}${endpoint}`)
    .set(getAuthHeader(token));
  
  if (data && (method === 'post' || method === 'put' || method === 'patch')) {
    req.send(data);
  }
  
  return req;
};

// Pre-defined test users for consistency
export const TEST_USERS = {
  POSTER: {
    name: 'Test Poster',
    email: 'poster@test.com',
    password: 'password123',
    role: 'POSTER',
    location: 'Test City',
    phone: '+1234567890'
  },
  TASKER1: {
    name: 'Test Tasker 1',
    email: 'tasker1@test.com',
    password: 'password123',
    role: 'TASKER',
    location: 'Test City',
    phone: '+1234567891'
  },
  TASKER2: {
    name: 'Test Tasker 2',
    email: 'tasker2@test.com',
    password: 'password123',
    role: 'TASKER',
    location: 'Test City',
    phone: '+1234567892'
  }
} as const;