import express from 'express';
import passport from '../../../config/passport';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
const router = express.Router();

// User Login
router.post(
  '/login',
  validateRequest(AuthValidation.createLoginZodSchema),
  AuthController.loginUser
);

// Google OAuth Login
router.get('/google', (req, res, next) => {
  const role = (req.query.role as string) || 'POSTER';
  const state = Buffer.from(JSON.stringify({ role })).toString('base64');
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state,
  })(req, res, next);
});

// Google OAuth Callback
router.get(
  '/google/callback',
  (req, res, next) => {
    next();
  },
  passport.authenticate('google', { session: false }),
  AuthController.googleCallback
);

// User Logout
router.post(
  '/logout',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.TASKER, USER_ROLES.POSTER),
  AuthController.logoutUser
);

// Forget Password Request
router.post(
  '/forget-password',
  validateRequest(AuthValidation.createForgetPasswordZodSchema),
  AuthController.forgetPassword
);

// Email Verification
router.post(
  '/verify-email',
  validateRequest(AuthValidation.createVerifyEmailZodSchema),
  AuthController.verifyEmail
);

// Reset Password
router.post(
  '/reset-password',
  validateRequest(AuthValidation.createResetPasswordZodSchema),
  AuthController.resetPassword
);

// Change Password
router.post(
  '/change-password',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.TASKER, USER_ROLES.POSTER),
  validateRequest(AuthValidation.createChangePasswordZodSchema),
  AuthController.changePassword
);

// Resend Verification Email
router.post('/resend-verify-email', AuthController.resendVerifyEmail);

export const AuthRoutes = router;
