"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const rating_controller_1 = require("./rating.controller");
const rating_validation_1 = require("./rating.validation");
const router = express_1.default.Router();
// Create a new rating
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER), (0, validateRequest_1.default)(rating_validation_1.RatingValidation.createRatingZodSchema), rating_controller_1.RatingController.createRating);
// Get all ratings with filters and pagination
router.get('/', 
// auth(USER_ROLES.SUPER_ADMIN),
(0, validateRequest_1.default)(rating_validation_1.RatingValidation.getRatingsQueryZodSchema), rating_controller_1.RatingController.getAllRatings);
// Get all ratings given by the current authenticated user
router.get('/my-ratings', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER), rating_controller_1.RatingController.getMyRatings);
// Get current user's rating statistics (average, total count, etc.)
router.get('/my-stats', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER), rating_controller_1.RatingController.getMyRatingStats);
// Get a specific rating by its ID
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER), (0, validateRequest_1.default)(rating_validation_1.RatingValidation.ratingIdParamZodSchema), rating_controller_1.RatingController.getSingleRating);
// Update a specific rating by ID
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER), (0, validateRequest_1.default)(rating_validation_1.RatingValidation.ratingIdParamZodSchema), (0, validateRequest_1.default)(rating_validation_1.RatingValidation.updateRatingZodSchema), rating_controller_1.RatingController.updateRating);
// Delete a specific rating by ID
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER), (0, validateRequest_1.default)(rating_validation_1.RatingValidation.ratingIdParamZodSchema), rating_controller_1.RatingController.deleteRating);
// Get all ratings for a specific user
router.get('/user/:userId', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER), (0, validateRequest_1.default)(rating_validation_1.RatingValidation.userIdParamZodSchema), rating_controller_1.RatingController.getUserRatings);
// Get rating statistics (average, total count, etc.) for a specific user
router.get('/user/:userId/stats', (0, validateRequest_1.default)(rating_validation_1.RatingValidation.userIdParamZodSchema), rating_controller_1.RatingController.getUserRatingStats);
// Get all ratings for a specific task
router.get('/task/:taskId', (0, validateRequest_1.default)(rating_validation_1.RatingValidation.taskIdParamZodSchema), rating_controller_1.RatingController.getTaskRatings);
exports.RatingRoutes = router;
