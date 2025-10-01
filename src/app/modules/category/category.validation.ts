import { z } from 'zod';

const createCategoryZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Category name is required' }),
    description: z.string().optional(),
    icon: z.string({ required_error: 'Category icon is required' }),
  }),
});

const updateCategoryZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    isDeleted: z.boolean().optional(),
  }),
});

export const CategoryValidation = {
  createCategoryZodSchema,
  updateCategoryZodSchema,
};
