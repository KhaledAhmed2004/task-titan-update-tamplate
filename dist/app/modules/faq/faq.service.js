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
exports.FaqService = void 0;
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const faq_model_1 = require("./faq.model");
const serviceHelpers_1 = require("../../../helpers/serviceHelpers");
// Create a new FAQ
const createFaq = (faqData) => __awaiter(void 0, void 0, void 0, function* () {
    const faq = yield faq_model_1.Faq.create(faqData);
    return faq;
});
// Get all FAQs
const getAllFaqs = () => __awaiter(void 0, void 0, void 0, function* () {
    const faqs = yield faq_model_1.Faq.find();
    return faqs;
});
// Get a single FAQ by ID
const getFaqById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const faq = yield faq_model_1.Faq.findById(id);
    if (!faq) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'FAQ not found');
    }
    return faq;
});
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
const updateFaq = (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, serviceHelpers_1.updateByIdOrThrow)(faq_model_1.Faq, id, updateData, 'FAQ');
});
// Delete a FAQ
const deleteFaq = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, serviceHelpers_1.deleteByIdOrThrow)(faq_model_1.Faq, id, 'FAQ');
});
exports.FaqService = {
    createFaq,
    getAllFaqs,
    getFaqById,
    updateFaq,
    deleteFaq,
};
