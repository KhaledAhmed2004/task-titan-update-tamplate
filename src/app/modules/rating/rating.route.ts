import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { RatingController } from './rating.controller';
import { RatingValidation } from './rating.validation';

const router = express.Router();

// Create a new rating
router.post(
  '/',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  validateRequest(RatingValidation.createRatingZodSchema),
  RatingController.createRating
);

// Get all ratings with filters and pagination
router.get(
  '/',
  // auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(RatingValidation.getRatingsQueryZodSchema),
  RatingController.getAllRatings
);

// Get all ratings given by the current authenticated user
router.get(
  '/my-ratings',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  RatingController.getMyRatings
);

// Get current user's rating statistics (average, total count, etc.)
router.get(
  '/my-stats',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  RatingController.getMyRatingStats
);

// Get a specific rating by its ID
router.get(
  '/:id',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  validateRequest(RatingValidation.ratingIdParamZodSchema),
  RatingController.getSingleRating
);

// Update a specific rating by ID
router.patch(
  '/:id',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  validateRequest(RatingValidation.ratingIdParamZodSchema),
  validateRequest(RatingValidation.updateRatingZodSchema),
  RatingController.updateRating
);

// Delete a specific rating by ID
router.delete(
  '/:id',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  validateRequest(RatingValidation.ratingIdParamZodSchema),
  RatingController.deleteRating
);

// Get all ratings for a specific user
router.get(
  '/user/:userId',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  validateRequest(RatingValidation.userIdParamZodSchema),
  RatingController.getUserRatings
);

// Get rating statistics (average, total count, etc.) for a specific user
router.get(
  '/user/:userId/stats',
  validateRequest(RatingValidation.userIdParamZodSchema),
  RatingController.getUserRatingStats
);

// Get all ratings for a specific task
router.get(
  '/task/:taskId',
  validateRequest(RatingValidation.taskIdParamZodSchema),
  RatingController.getTaskRatings
);

export const RatingRoutes = router;
