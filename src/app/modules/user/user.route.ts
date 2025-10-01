import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = express.Router();

// Create a new user
router.post(
  '/',
  validateRequest(UserValidation.createUserZodSchema),
  UserController.createUser
);

// Get user own profile
router.get(
  '/profile',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
  UserController.getUserProfile
);

// Update user profile
router.patch(
  '/profile',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
  fileUploadHandler(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      // Parse and validate JSON data from form-data
      req.body = UserValidation.updateUserZodSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    return UserController.updateProfile(req, res, next);
  }
);

// Get all users
router.get('/', auth(USER_ROLES.SUPER_ADMIN), UserController.getAllUsers);

// Get user stats
router.get('/stats', auth(USER_ROLES.SUPER_ADMIN), UserController.getUserStats);

// Get user distribution (taskers vs posters in %)
router.get(
  '/distribution',
  auth(USER_ROLES.SUPER_ADMIN),
  UserController.getUserDistribution
);

// Block a user
router.patch(
  '/:id/block',
  auth(USER_ROLES.SUPER_ADMIN),
  UserController.blockUser
);

// Unblock a user
router.patch(
  '/:id/unblock',
  auth(USER_ROLES.SUPER_ADMIN),
  UserController.unblockUser
);

// Get a specific user by ID
router.get('/:id', auth(USER_ROLES.SUPER_ADMIN), UserController.getUserById);

// Get a specific user by ID
router.get('/:id/user', UserController.getUserDetailsById);

export const UserRoutes = router;
