import { Category } from './category.model';
import { ICategory } from './category.interface';
import { TaskModel } from '../task/task.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';

const createCategory = async (payload: ICategory) => {
  return await Category.create(payload);
};

const getAllCategories = async () => {
  // Only fetch categories that are not soft-deleted
  return await Category.find({ isDeleted: false });
};

const updateCategory = async (id: string, payload: Partial<ICategory>) => {
  // Step 1: Check if the category exists and is not deleted
  const existingCategory = await Category.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!existingCategory) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Category with id ${id} not found or already deleted`
    );
  }

  // Step 2: Try updating the category
  const updatedCategory = await Category.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { new: true } // return the updated document
  );

  // Step 3: Handle if update fails for some reason
  if (!updatedCategory) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to update category with id ${id}. Please try again.`
    );
  }

  // Step 4: Return the updated category
  return updatedCategory;
};

const deleteCategory = async (id: string) => {
  const deleted = await Category.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!deleted) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Category with id ${id} not found or already deleted`
    );
  }

  return deleted;
};

const getTopCategoryThisMonth = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Step 1: Get all categories
  const categories = await Category.find({ isDeleted: false }).lean();

  // Step 2: Count tasks per category this month
  const taskCounts = await TaskModel.aggregate([
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $group: { _id: '$taskCategory', count: { $sum: 1 } } },
  ]);

  // Convert taskCounts to a map for easy lookup
  const taskCountMap: Record<string, number> = {};
  taskCounts.forEach(tc => {
    taskCountMap[tc._id.toString()] = tc.count;
  });

  const totalTasksThisMonth = await TaskModel.countDocuments({
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
};
export const CategoryService = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getTopCategoryThisMonth,
};
