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
exports.TaskController = void 0;
const http_status_codes_1 = require("http-status-codes");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const task_service_1 = require("./task.service");
const getFilePath_1 = require("../../../shared/getFilePath");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const createTask = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user.id;
    const taskImage = (0, getFilePath_1.getMultipleFilesPath)(req.files, 'image');
    const task = Object.assign(Object.assign({}, req.body), { taskImage,
        userId });
    const result = yield task_service_1.TaskService.createTask(task);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Task created successfully',
        data: result,
    });
}));
const getAllTasks = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user.id;
    const query = req.query;
    const result = yield task_service_1.TaskService.getAllTasks(query, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Tasks retrieved successfully',
        data: result.data,
        pagination: result.pagination,
    });
}));
const getTaskStatistics = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield task_service_1.TaskService.getTaskStats();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Task stats retrieved successfully',
        data: result,
    });
}));
const getTaskById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const result = yield task_service_1.TaskService.getTaskById(taskId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Task retrieved successfully',
        data: result,
    });
}));
const updateTask = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const taskImages = (0, getFilePath_1.getMultipleFilesPath)(req.files, 'image');
    const payload = Object.assign(Object.assign({}, req.body), { taskImages });
    const result = yield task_service_1.TaskService.updateTask(taskId, payload);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Task updated successfully',
        data: result,
    });
}));
const deleteTask = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const result = yield task_service_1.TaskService.deleteTask(taskId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Task deleted successfully',
        data: result,
    });
}));
// Get all tasks
const getMyTasks = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user.id;
    const query = req.query;
    const result = yield task_service_1.TaskService.getAllTasksByUser(userId, query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Your tasks retrieved successfully',
        data: result.data,
        pagination: result.pagination,
    });
}));
const getLastSixMonthsCompletionStats = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield task_service_1.TaskService.getLastSixMonthsCompletionStats();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Last 6 months task completion stats retrieved successfully',
        data: result,
    });
}));
const getMyTaskById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const userId = user.id;
    const { taskId } = req.params;
    const result = yield task_service_1.TaskService.getMyTaskById(userId, taskId);
    res.status(200).json({
        success: true,
        message: 'Task retrieved successfully',
        data: result,
    });
}));
// Complete task and release payment
const completeTask = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const clientId = user.id;
    const { taskId } = req.params;
    const result = yield task_service_1.TaskService.completeTask(taskId, clientId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Task completed successfully and payment released',
        data: result,
    });
}));
const cancelTask = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const user = req.user;
    const userId = user.id;
    const { reason } = req.body;
    const result = yield task_service_1.TaskService.cancelTask(taskId, userId, reason);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Task cancelled successfully',
        data: result,
    });
}));
// Submit delivery (Tasker)
const submitDelivery = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const taskerId = user.id;
    const { taskId } = req.params;
    const result = yield task_service_1.TaskService.submitDelivery(taskId, taskerId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Delivery submitted successfully. Awaiting review.',
        data: result,
    });
}));
const getSimilarTasks = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const result = yield task_service_1.TaskService.getSimilarTasks(taskId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Similar tasks retrieved successfully',
        data: result,
    });
}));
exports.TaskController = {
    createTask,
    getTaskStatistics,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
    getMyTasks,
    getLastSixMonthsCompletionStats,
    getMyTaskById,
    completeTask,
    cancelTask,
    submitDelivery,
    getSimilarTasks,
};
