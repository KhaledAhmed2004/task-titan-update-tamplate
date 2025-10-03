import mongoose, { Model, Types } from 'mongoose';
import ApiError from '../errors/ApiError';
import { StatusCodes } from 'http-status-codes';

// Type for ID parameters that can be either string or ObjectId
type IdType = string | Types.ObjectId;

/**
 * Generic function to find a document by ID with error handling
 * @param model - Mongoose model
 * @param id - Document ID (string or ObjectId)
 * @param entityName - Name of the entity for error messages
 * @returns Found document
 * @throws ApiError if document not found
 */
export const findByIdOrThrow = async <T>(
  model: Model<T>,
  id: IdType,
  entityName: string = 'Resource'
): Promise<T> => {
  const document = await model.findById(id);
  if (!document) {
    throw new ApiError(StatusCodes.NOT_FOUND, `${entityName} not found`);
  }
  return document;
};

/**
 * Generic function to update a document by ID with validation
 * @param model - Mongoose model
 * @param id - Document ID (string or ObjectId)
 * @param updateData - Data to update
 * @param entityName - Name of the entity for error messages
 * @returns Updated document
 * @throws ApiError if document not found
 */
export const updateByIdOrThrow = async <T>(
  model: Model<T>,
  id: IdType,
  updateData: Partial<T>,
  entityName: string = 'Resource'
): Promise<T> => {
  const updatedDocument = await model.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  
  if (!updatedDocument) {
    throw new ApiError(StatusCodes.NOT_FOUND, `${entityName} not found`);
  }
  
  return updatedDocument;
};

/**
 * Generic function to delete a document by ID with validation
 * @param model - Mongoose model
 * @param id - Document ID (string or ObjectId)
 * @param entityName - Name of the entity for error messages
 * @returns Deleted document
 * @throws ApiError if document not found
 */
export const deleteByIdOrThrow = async <T>(
  model: Model<T>,
  id: IdType,
  entityName: string = 'Resource'
): Promise<T> => {
  const deletedDocument = await model.findByIdAndDelete(id);
  if (!deletedDocument) {
    throw new ApiError(StatusCodes.NOT_FOUND, `${entityName} not found`);
  }
  return deletedDocument;
};

/**
 * Generic function to soft delete a document (set isDeleted: true)
 * @param model - Mongoose model
 * @param id - Document ID (string or ObjectId)
 * @param entityName - Name of the entity for error messages
 * @returns Updated document
 * @throws ApiError if document not found
 */
export const softDeleteByIdOrThrow = async <T>(
  model: Model<T>,
  id: IdType,
  entityName: string = 'Resource'
): Promise<T> => {
  const updatedDocument = await model.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true, runValidators: true }
  );
  
  if (!updatedDocument) {
    throw new ApiError(StatusCodes.NOT_FOUND, `${entityName} not found`);
  }
  
  return updatedDocument;
};

/**
 * Check if a document exists by ID
 * @param model - Mongoose model
 * @param id - Document ID (string or ObjectId)
 * @returns Boolean indicating existence
 */
export const existsById = async <T>(
  model: Model<T>,
  id: IdType
): Promise<boolean> => {
  const document = await model.findById(id).select('_id');
  return !!document;
};

/**
 * Get document count with optional filter
 * @param model - Mongoose model
 * @param filter - Optional filter conditions
 * @returns Document count
 */
export const getCount = async <T>(
  model: Model<T>,
  filter: Record<string, unknown> = {}
): Promise<number> => {
  return await model.countDocuments(filter);
};

/**
 * Run a set of operations inside a MongoDB transaction
 * @param fn - Callback that receives the session and returns a result
 * @returns Result of the callback after commit
 */
export const withTransaction = async <T>(
  fn: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Ensure a document's status matches expected value(s), otherwise throw
 * @param currentStatus - The current status value
 * @param expected - A single expected status or a list of allowed statuses
 * @param options - Optional error customization
 */
export const ensureStatusOrThrow = (
  currentStatus: string | number,
  expected: string | number | Array<string | number>,
  options?: { entityName?: string; message?: string; code?: number }
): void => {
  const ok = Array.isArray(expected)
    ? expected.includes(currentStatus)
    : currentStatus === expected;

  if (!ok) {
    const code = options?.code ?? StatusCodes.BAD_REQUEST;
    const entity = options?.entityName ?? 'Resource';
    const message =
      options?.message ?? `${entity} has invalid status: ${String(currentStatus)}`;
    throw new ApiError(code, message);
  }
};

/**
 * Ensure the acting user owns the entity (by owner key), otherwise throw
 * @param entity - The document to check
 * @param ownerKey - The key that holds the owner's id (e.g. 'userId')
 * @param userId - The acting user's id
 * @param options - Optional error customization
 */
export const ensureOwnershipOrThrow = (
  entity: Record<string, unknown>,
  ownerKey: string,
  userId: Types.ObjectId | string,
  options?: { message?: string; code?: number }
): void => {
  const owner = entity?.[ownerKey] as Types.ObjectId | string | undefined;
  const ownerStr = owner ? owner.toString() : '';
  const userStr = userId.toString();

  if (!owner || ownerStr !== userStr) {
    const code = options?.code ?? StatusCodes.FORBIDDEN;
    const message = options?.message ?? 'You are not authorized to perform this action';
    throw new ApiError(code, message);
  }
};