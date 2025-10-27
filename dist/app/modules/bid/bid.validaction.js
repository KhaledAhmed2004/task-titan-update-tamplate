"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const createBidZodSchema = zod_1.default.object({
    body: zod_1.default.object({
        amount: zod_1.default
            .number({ required_error: 'Amount is required' })
            .positive({ message: 'Amount must be greater than 0' }),
        message: zod_1.default.string({ required_error: 'Message is required' }).min(1, 'Message cannot be empty'),
    }),
});
const updateBidZodSchema = zod_1.default.object({
    body: zod_1.default.object({
        amount: zod_1.default
            .number()
            .positive({ message: 'Amount must be greater than 0' })
            .optional(),
        message: zod_1.default.string().optional(),
    }),
});
exports.BidValidation = { createBidZodSchema, updateBidZodSchema };
