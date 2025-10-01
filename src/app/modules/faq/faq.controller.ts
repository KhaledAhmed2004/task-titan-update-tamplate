import { Request, Response } from 'express';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { Faq } from './faq.model';

// Create a new FAQ
const createFaq = catchAsync(async (req: Request, res: Response) => {
  const faq = await Faq.create(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'FAQ created successfully',
    data: faq,
  });
});

// Get all FAQs
const getAllFaqs = catchAsync(async (req: Request, res: Response) => {
  const faqs = await Faq.find();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'FAQs retrieved successfully',
    data: faqs,
  });
});

// Get a single FAQ by ID
const getFaqById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const faq = await Faq.findById(id);

  if (!faq) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'FAQ not found');
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'FAQ retrieved successfully',
    data: faq,
  });
});

// Update FAQ
const updateFaq = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const updatedFaq = await Faq.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedFaq) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'FAQ not found');
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'FAQ updated successfully',
    data: updatedFaq,
  });
});

// Delete FAQ
const deleteFaq = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deletedFaq = await Faq.findByIdAndDelete(id);

  if (!deletedFaq) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'FAQ not found');
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'FAQ deleted successfully',
    data: deletedFaq,
  });
});

// Export all functions together in one object
export const FaqController = {
  createFaq,
  getAllFaqs,
  getFaqById,
  updateFaq,
  deleteFaq,
};
