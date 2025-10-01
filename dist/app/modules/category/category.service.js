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
exports.CategoryService = void 0;
const category_model_1 = require("./category.model");
const task_model_1 = require("../task/task.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const createCategory = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield category_model_1.Category.create(payload);
});
const getAllCategories = () => __awaiter(void 0, void 0, void 0, function* () {
    // Only fetch categories that are not soft-deleted
    return yield category_model_1.Category.find({ isDeleted: false });
});
const updateCategory = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Step 1: Check if the category exists and is not deleted
    const existingCategory = yield category_model_1.Category.findOne({
        _id: id,
        isDeleted: false,
    });
    if (!existingCategory) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `Category with id ${id} not found or already deleted`);
    }
    // Step 2: Try updating the category
    const updatedCategory = yield category_model_1.Category.findOneAndUpdate({ _id: id, isDeleted: false }, payload, { new: true } // return the updated document
    );
    // Step 3: Handle if update fails for some reason
    if (!updatedCategory) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update category with id ${id}. Please try again.`);
    }
    // Step 4: Return the updated category
    return updatedCategory;
});
const deleteCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const deleted = yield category_model_1.Category.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!deleted) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `Category with id ${id} not found or already deleted`);
    }
    return deleted;
});
const getTopCategoryThisMonth = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // Step 1: Get all categories
    const categories = yield category_model_1.Category.find({ isDeleted: false }).lean();
    // Step 2: Count tasks per category this month
    const taskCounts = yield task_model_1.TaskModel.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: '$taskCategory', count: { $sum: 1 } } },
    ]);
    // Convert taskCounts to a map for easy lookup
    const taskCountMap = {};
    taskCounts.forEach(tc => {
        taskCountMap[tc._id.toString()] = tc.count;
    });
    const totalTasksThisMonth = yield task_model_1.TaskModel.countDocuments({
        createdAt: { $gte: startOfMonth },
    });
    // Step 3: Build final result with 0% for categories with no tasks
    const resultWithPercentage = categories.map(cat => {
        const count = taskCountMap[cat._id.toString()] || 0;
        const percentage = totalTasksThisMonth
            ? ((count / totalTasksThisMonth) * 100).toFixed(2)
            : '0.00';
        return {
            categoryId: cat._id,
            categoryName: cat.name,
            count,
            percentage,
        };
    });
    return resultWithPercentage;
});
exports.CategoryService = {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
    getTopCategoryThisMonth,
};
