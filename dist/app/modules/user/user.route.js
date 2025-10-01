"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const fileUploadHandler_1 = __importDefault(require("../../middlewares/fileUploadHandler"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const router = express_1.default.Router();
// Create a new user
router.post('/', (0, validateRequest_1.default)(user_validation_1.UserValidation.createUserZodSchema), user_controller_1.UserController.createUser);
// Get user own profile
router.get('/profile', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getUserProfile);
// Update user profile
router.patch('/profile', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER, user_1.USER_ROLES.SUPER_ADMIN), (0, fileUploadHandler_1.default)(), (req, res, next) => {
    if (req.body.data) {
        // Parse and validate JSON data from form-data
        req.body = user_validation_1.UserValidation.updateUserZodSchema.parse(JSON.parse(req.body.data));
    }
    return user_controller_1.UserController.updateProfile(req, res, next);
});
// Get all users
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getAllUsers);
// Get user stats
router.get('/stats', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getUserStats);
// Get user distribution (taskers vs posters in %)
router.get('/distribution', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getUserDistribution);
// Block a user
router.patch('/:id/block', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.blockUser);
// Unblock a user
router.patch('/:id/unblock', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.unblockUser);
// Get a specific user by ID
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getUserById);
// Get a specific user by ID
router.get('/:id/user', user_controller_1.UserController.getUserDetailsById);
exports.UserRoutes = router;
