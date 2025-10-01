import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { CategoryService } from './category.service';

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.createCategory(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const getAllCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await CategoryService.getAllCategories();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Categories fetched successfully',
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CategoryService.updateCategory(id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CategoryService.deleteCategory(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
});

const getTopCategory = catchAsync(async (_req: Request, res: Response) => {
  const result = await CategoryService.getTopCategoryThisMonth();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Top categories fetched successfully',
    data: result,
  });
});

export const CategoryController = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getTopCategory,
};
