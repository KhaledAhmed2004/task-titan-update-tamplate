"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRoutes = void 0;
const express_1 = require("express");
const task_controller_1 = require("./task.controller");
const task_validation_1 = require("./task.validation");
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const fileUploadHandler_1 = __importDefault(require("../../middlewares/fileUploadHandler"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const router = (0, express_1.Router)();
// create task
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.POSTER), (0, fileUploadHandler_1.default)(), (req, res, next) => {
    if (req.body.data) {
        // Parse JSON from form-data
        req.body = task_validation_1.TaskValidation.createTaskZodSchema.parse(JSON.parse(req.body.data));
    }
    // Call createTask wrapped in catchAsync, just like updateProfile
    return task_controller_1.TaskController.createTask(req, res, next);
});
// get all tasks
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER, user_1.USER_ROLES.GUEST, user_1.USER_ROLES.SUPER_ADMIN), task_controller_1.TaskController.getAllTasks);
// Get task statistics
router.get('/stats', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), task_controller_1.TaskController.getTaskStatistics);
// get tasks of the current user (poster)
router.get('/my-tasks', (0, auth_1.default)(user_1.USER_ROLES.POSTER), task_controller_1.TaskController.getMyTasks);
// get a specific task of the current user (poster) by ID
router.get('/my-tasks/:taskId', (0, auth_1.default)(user_1.USER_ROLES.POSTER), task_controller_1.TaskController.getMyTaskById);
// get task by id
router.get('/:taskId', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.POSTER, user_1.USER_ROLES.TASKER), task_controller_1.TaskController.getTaskById);
// update task
router.put('/:taskId', (0, auth_1.default)(user_1.USER_ROLES.POSTER), (0, fileUploadHandler_1.default)(), // handle taskImage upload
(req, res, next) => {
    if (req.body.data) {
        // Parse JSON from form-data
        req.body = task_validation_1.TaskValidation.updateTaskZodSchema.parse(JSON.parse(req.body.data));
    }
    // Call createTask wrapped in catchAsync, just like updateProfile
    return task_controller_1.TaskController.updateTask(req, res, next);
});
// delete task
router.delete('/:taskId', (0, auth_1.default)(user_1.USER_ROLES.POSTER), task_controller_1.TaskController.deleteTask);
// Get last 6 months completion stats with growth percentage
router.get('/completion-stats/last-6-months', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.POSTER), task_controller_1.TaskController.getLastSixMonthsCompletionStats);
// complete task and release payment
router.patch('/:taskId/complete', (0, auth_1.default)(user_1.USER_ROLES.POSTER), task_controller_1.TaskController.completeTask);
// Cancel task
router.patch('/:taskId/cancel', (0, auth_1.default)(user_1.USER_ROLES.POSTER), (0, validateRequest_1.default)(task_validation_1.TaskValidation.cancelTaskZodSchema), task_controller_1.TaskController.cancelTask);
// Submit delivery for a task (by Tasker)
router.post('/:taskId/submit', (0, auth_1.default)(user_1.USER_ROLES.TASKER), task_controller_1.TaskController.submitDelivery);
// Get similar tasks by taskId
router.get('/:taskId/similar', task_controller_1.TaskController.getSimilarTasks);
exports.TaskRoutes = router;
