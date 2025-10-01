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
exports.getCount = exports.existsById = exports.softDeleteByIdOrThrow = exports.deleteByIdOrThrow = exports.updateByIdOrThrow = exports.findByIdOrThrow = void 0;
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
/**
 * Generic function to find a document by ID with error handling
 * @param model - Mongoose model
 * @param id - Document ID (string or ObjectId)
 * @param entityName - Name of the entity for error messages
 * @returns Found document
 * @throws ApiError if document not found
 */
const findByIdOrThrow = (model_1, id_1, ...args_1) => __awaiter(void 0, [model_1, id_1, ...args_1], void 0, function* (model, id, entityName = 'Resource') {
    const document = yield model.findById(id);
    if (!document) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `${entityName} not found`);
    }
    return document;
});
exports.findByIdOrThrow = findByIdOrThrow;
/**
 * Generic function to update a document by ID with validation
 * @param model - Mongoose model
 * @param id - Document ID (string or ObjectId)
 * @param updateData - Data to update
 * @param entityName - Name of the entity for error messages
 * @returns Updated document
 * @throws ApiError if document not found
 */
const updateByIdOrThrow = (model_1, id_1, updateData_1, ...args_1) => __awaiter(void 0, [model_1, id_1, updateData_1, ...args_1], void 0, function* (model, id, updateData, entityName = 'Resource') {
    const updatedDocument = yield model.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });
    if (!updatedDocument) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `${entityName} not found`);
    }
    return updatedDocument;
});
exports.updateByIdOrThrow = updateByIdOrThrow;
/**
 * Generic function to delete a document by ID with validation
 * @param model - Mongoose model
 * @param id - Document ID (string or ObjectId)
 * @param entityName - Name of the entity for error messages
 * @returns Deleted document
 * @throws ApiError if document not found
 */
const deleteByIdOrThrow = (model_1, id_1, ...args_1) => __awaiter(void 0, [model_1, id_1, ...args_1], void 0, function* (model, id, entityName = 'Resource') {
    const deletedDocument = yield model.findByIdAndDelete(id);
    if (!deletedDocument) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `${entityName} not found`);
    }
    return deletedDocument;
});
exports.deleteByIdOrThrow = deleteByIdOrThrow;
/**
 * Generic function to soft delete a document (set isDeleted: true)
 * @param model - Mongoose model
 * @param id - Document ID (string or ObjectId)
 * @param entityName - Name of the entity for error messages
 * @returns Updated document
 * @throws ApiError if document not found
 */
const softDeleteByIdOrThrow = (model_1, id_1, ...args_1) => __awaiter(void 0, [model_1, id_1, ...args_1], void 0, function* (model, id, entityName = 'Resource') {
    const updatedDocument = yield model.findByIdAndUpdate(id, { isDeleted: true }, { new: true, runValidators: true });
    if (!updatedDocument) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `${entityName} not found`);
    }
    return updatedDocument;
});
exports.softDeleteByIdOrThrow = softDeleteByIdOrThrow;
/**
 * Check if a document exists by ID
 * @param model - Mongoose model
 * @param id - Document ID (string or ObjectId)
 * @returns Boolean indicating existence
 */
const existsById = (model, id) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield model.findById(id).select('_id');
    return !!document;
});
exports.existsById = existsById;
/**
 * Get document count with optional filter
 * @param model - Mongoose model
 * @param filter - Optional filter conditions
 * @returns Document count
 */
const getCount = (model_1, ...args_1) => __awaiter(void 0, [model_1, ...args_1], void 0, function* (model, filter = {}) {
    return yield model.countDocuments(filter);
});
exports.getCount = getCount;
