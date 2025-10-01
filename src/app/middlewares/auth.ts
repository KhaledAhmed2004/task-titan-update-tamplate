import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../../errors/ApiError';
import { jwtHelper } from '../../helpers/jwtHelper';
import { USER_ROLES } from '../../enums/user';

const auth =
  (...allowedRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      // 1️⃣ Allow GUEST access if route permits it and no token is provided
      if (!authHeader && allowedRoles.includes(USER_ROLES.GUEST)) {
        req.user = { role: USER_ROLES.GUEST, id: null, email: null };
        return next();
      }

      // 2️⃣ No token provided and route doesn't allow guests
      if (!authHeader) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          'Authorization token is required'
        );
      }

      // 3️⃣ Validate Bearer format
      if (!authHeader.startsWith('Bearer ')) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          'Authorization header must start with "Bearer "'
        );
      }

      // 4️⃣ Extract token and ensure it's not empty
      const token = authHeader.split(' ')[1];
      if (!token || token.trim() === '') {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Valid token is required');
      }

      // 5️⃣ Verify JWT token
      const verifiedUser = jwtHelper.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      );

      if (!verifiedUser || !verifiedUser.role) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token payload');
      }

      // 6️⃣ Attach verified user to request
      req.user = verifiedUser;

      // 7️⃣ Role-based access check
      if (allowedRoles.length && !allowedRoles.includes(verifiedUser.role)) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You don't have permission to access this API"
        );
      }

      // 8️⃣ Proceed
      next();
    } catch (error: any) {
      // Handle JWT-specific errors
      if (error.name === 'JsonWebTokenError') {
        return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token'));
      }
      if (error.name === 'TokenExpiredError') {
        return next(
          new ApiError(StatusCodes.UNAUTHORIZED, 'Token has expired')
        );
      }
      if (error.name === 'NotBeforeError') {
        return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Token not active'));
      }

      // Pass other errors
      next(error);
    }
  };

export default auth;
