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
exports.ensureOwnershipOrThrow = exports.ensureStatusOrThrow = exports.withTransaction = exports.getCount = exports.existsById = exports.softDeleteByIdOrThrow = exports.deleteByIdOrThrow = exports.updateByIdOrThrow = exports.findByIdOrThrow = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
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
/**
 * Run a set of operations inside a MongoDB transaction
 * @param fn - Callback that receives the session and returns a result
 * @returns Result of the callback after commit
 */
const withTransaction = (fn) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const result = yield fn(session);
        yield session.commitTransaction();
        return result;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
exports.withTransaction = withTransaction;
/**
 * Ensure a document's status matches expected value(s), otherwise throw
 * @param currentStatus - The current status value
 * @param expected - A single expected status or a list of allowed statuses
 * @param options - Optional error customization
 */
const ensureStatusOrThrow = (currentStatus, expected, options) => {
    var _a, _b, _c;
    const ok = Array.isArray(expected)
        ? expected.includes(currentStatus)
        : currentStatus === expected;
    if (!ok) {
        const code = (_a = options === null || options === void 0 ? void 0 : options.code) !== null && _a !== void 0 ? _a : http_status_codes_1.StatusCodes.BAD_REQUEST;
        const entity = (_b = options === null || options === void 0 ? void 0 : options.entityName) !== null && _b !== void 0 ? _b : 'Resource';
        const message = (_c = options === null || options === void 0 ? void 0 : options.message) !== null && _c !== void 0 ? _c : `${entity} has invalid status: ${String(currentStatus)}`;
        throw new ApiError_1.default(code, message);
    }
};
exports.ensureStatusOrThrow = ensureStatusOrThrow;
/**
 * Ensure the acting user owns the entity (by owner key), otherwise throw
 * @param entity - The document to check
 * @param ownerKey - The key that holds the owner's id (e.g. 'userId')
 * @param userId - The acting user's id
 * @param options - Optional error customization
 */
const ensureOwnershipOrThrow = (entity, ownerKey, userId, options) => {
    var _a, _b;
    const owner = entity === null || entity === void 0 ? void 0 : entity[ownerKey];
    const ownerStr = owner ? owner.toString() : '';
    const userStr = userId.toString();
    if (!owner || ownerStr !== userStr) {
        const code = (_a = options === null || options === void 0 ? void 0 : options.code) !== null && _a !== void 0 ? _a : http_status_codes_1.StatusCodes.FORBIDDEN;
        const message = (_b = options === null || options === void 0 ? void 0 : options.message) !== null && _b !== void 0 ? _b : 'You are not authorized to perform this action';
        throw new ApiError_1.default(code, message);
    }
};
exports.ensureOwnershipOrThrow = ensureOwnershipOrThrow;
