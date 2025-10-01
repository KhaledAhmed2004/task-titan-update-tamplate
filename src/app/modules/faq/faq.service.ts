import { IFaq } from './faq.interface';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Faq } from './faq.model';
import { deleteByIdOrThrow, updateByIdOrThrow } from '../../../helpers/serviceHelpers';

// Create a new FAQ
const createFaq = async (faqData: IFaq) => {
  const faq = await Faq.create(faqData);
  return faq;
};

// Get all FAQs
const getAllFaqs = async () => {
  const faqs = await Faq.find();
  return faqs;
};

// Get a single FAQ by ID
const getFaqById = async (id: string) => {
  const faq = await Faq.findById(id);
  if (!faq) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'FAQ not found');
  }
  return faq;
};

// // Update a FAQ
// const updateFaq = async (id: string, updateData: Partial<IFaq>) => {
//   const updatedFaq = await Faq.findByIdAndUpdate(id, updateData, {
//     new: true,
//     runValidators: true,
//   });
//   if (!updatedFaq) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'FAQ not found');
//   }
//   return updatedFaq;
// };

// // Delete a FAQ
// const deleteFaq = async (id: string) => {
//   const deletedFaq = await Faq.findByIdAndDelete(id);
//   if (!deletedFaq) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'FAQ not found');
//   }
//   return deletedFaq;
// };

// Update a FAQ
const updateFaq = async (id: string, updateData: Partial<IFaq>) => {
  return await updateByIdOrThrow(Faq, id, updateData, 'FAQ');
};

// Delete a FAQ
const deleteFaq = async (id: string) => {
  return await deleteByIdOrThrow(Faq, id, 'FAQ');
};

export const FaqService = {
  createFaq,
  getAllFaqs,
  getFaqById,
  updateFaq,
  deleteFaq,
};
