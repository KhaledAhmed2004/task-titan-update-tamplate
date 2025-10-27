"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const jwtHelper_1 = require("../../helpers/jwtHelper");
const user_1 = require("../../enums/user");
const auth = (...allowedRoles) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        // 1️⃣ Allow GUEST access if route permits it and no token is provided
        if (!authHeader && allowedRoles.includes(user_1.USER_ROLES.GUEST)) {
            req.user = { role: user_1.USER_ROLES.GUEST, id: null, email: null };
            return next();
        }
        // 2️⃣ No token provided and route doesn't allow guests
        if (!authHeader) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Authorization token is required');
        }
        // 3️⃣ Validate Bearer format
        if (!authHeader.startsWith('Bearer ')) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Authorization header must start with "Bearer "');
        }
        // 4️⃣ Extract token and ensure it's not empty
        const token = authHeader.split(' ')[1];
        if (!token || token.trim() === '') {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Valid token is required');
        }
        // 5️⃣ Verify JWT token
        const verifiedUser = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwt_secret);
        if (!verifiedUser || !verifiedUser.role) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid token payload');
        }
        // 6️⃣ Attach verified user to request
        req.user = verifiedUser;
        // 7️⃣ Role-based access check
        if (allowedRoles.length && !allowedRoles.includes(verifiedUser.role)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You don't have permission to access this API");
        }
        // 8️⃣ Proceed
        next();
    }
    catch (error) {
        // Handle JWT-specific errors
        if (error.name === 'JsonWebTokenError') {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid token'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Token has expired'));
        }
        if (error.name === 'NotBeforeError') {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Token not active'));
        }
        // Pass other errors
        next(error);
    }
});
exports.default = auth;
