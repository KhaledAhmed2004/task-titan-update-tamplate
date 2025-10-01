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
exports.BookmarkService = void 0;
const bookmark_model_1 = require("./bookmark.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const task_model_1 = require("../task/task.model");
const toggleBookmarkIntoDB = (userId, postId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Fetch post and existing bookmark in parallel
    const [post, existingBookmark] = yield Promise.all([
        task_model_1.TaskModel.findOne({ _id: postId, isDeleted: false }),
        bookmark_model_1.Bookmark.findOne({ user: userId, post: postId }),
    ]);
    // 2️⃣ If post doesn't exist, throw error
    if (!post) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Post does not exist');
    }
    // 3️⃣ Remove bookmark or create new bookmark in parallel-safe way
    if (existingBookmark) {
        // Atomic deletion
        const removedBookmark = yield bookmark_model_1.Bookmark.findOneAndDelete({
            _id: existingBookmark._id,
        });
        return {
            message: 'Bookmark removed successfully',
            bookmark: removedBookmark,
        };
    }
    else {
        // Atomic creation using upsert
        const newBookmark = yield bookmark_model_1.Bookmark.findOneAndUpdate({ user: userId, post: postId }, // filter
        { user: userId, post: postId }, // update
        { new: true, upsert: true } // create if not exists
        );
        if (!newBookmark) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.EXPECTATION_FAILED, 'Failed to add bookmark');
        }
        return {
            message: 'Bookmark added successfully',
            bookmark: newBookmark,
        };
    }
});
const getUserBookmarksFromDB = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    // Start with base query
    let modelQuery = bookmark_model_1.Bookmark.find({ user: userId });
    // Create a modified query that excludes category and searchTerm from filter()
    const modifiedQuery = Object.assign({}, query);
    delete modifiedQuery.category;
    delete modifiedQuery.searchTerm;
    // Create QueryBuilder instance
    const queryBuilder = new QueryBuilder_1.default(modelQuery, modifiedQuery)
        .filter()
        .dateFilter()
        .sort()
        .paginate()
        .fields();
    // Handle category filtering and search through populated post field
    if (query.category && query.searchTerm) {
        // Combined category filtering and search
        queryBuilder.searchInPopulatedFields('post', ['title', 'description', 'taskLocation'], query.searchTerm, { taskCategory: query.category });
    }
    else if (query.category) {
        // Category filtering only
        queryBuilder.populateWithMatch('post', { taskCategory: query.category });
    }
    else if (query.searchTerm) {
        // Search only
        queryBuilder.searchInPopulatedFields('post', ['title', 'description', 'taskLocation'], query.searchTerm);
    }
    else {
        // No filtering, just populate
        queryBuilder.populate(['post']);
    }
    // Get filtered results with custom pagination
    const result = yield queryBuilder.getFilteredResults(['post']);
    return result;
});
exports.BookmarkService = {
    toggleBookmarkIntoDB,
    getUserBookmarksFromDB,
};
