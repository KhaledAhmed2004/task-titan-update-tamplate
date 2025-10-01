import z from 'zod';

const createBidZodSchema = z.object({
  body: z.object({
    amount: z
      .number({ required_error: 'Amount is required' })
      .positive({ message: 'Amount must be greater than 0' }),
    message: z.string({ required_error: 'Message is required' }).min(1, 'Message cannot be empty'),
  }),
});

const updateBidZodSchema = z.object({
  body: z.object({
    amount: z
      .number()
      .positive({ message: 'Amount must be greater than 0' })
      .optional(),
    message: z.string().optional(),
  }),
});

export const BidValidation = { createBidZodSchema, updateBidZodSchema };
