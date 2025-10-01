"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("../../../config/passport"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_controller_1 = require("./auth.controller");
const auth_validation_1 = require("./auth.validation");
const router = express_1.default.Router();
// User Login
router.post('/login', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createLoginZodSchema), auth_controller_1.AuthController.loginUser);
// Google OAuth Login
router.get('/google', (req, res, next) => {
    const role = req.query.role || 'POSTER';
    const state = Buffer.from(JSON.stringify({ role })).toString('base64');
    passport_1.default.authenticate('google', {
        scope: ['profile', 'email'],
        state: state,
    })(req, res, next);
});
// Google OAuth Callback
router.get('/google/callback', (req, res, next) => {
    next();
}, passport_1.default.authenticate('google', { session: false }), auth_controller_1.AuthController.googleCallback);
// User Logout
router.post('/logout', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.TASKER, user_1.USER_ROLES.POSTER), auth_controller_1.AuthController.logoutUser);
// Forget Password Request
router.post('/forget-password', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createForgetPasswordZodSchema), auth_controller_1.AuthController.forgetPassword);
// Email Verification
router.post('/verify-email', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createVerifyEmailZodSchema), auth_controller_1.AuthController.verifyEmail);
// Reset Password
router.post('/reset-password', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createResetPasswordZodSchema), auth_controller_1.AuthController.resetPassword);
// Change Password
router.post('/change-password', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.TASKER, user_1.USER_ROLES.POSTER), (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createChangePasswordZodSchema), auth_controller_1.AuthController.changePassword);
// Resend Verification Email
router.post('/resend-verify-email', auth_controller_1.AuthController.resendVerifyEmail);
exports.AuthRoutes = router;
