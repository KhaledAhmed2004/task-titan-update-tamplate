import { z } from 'zod';

// ---------------------- CREATE REPORT ----------------------
export const createReportSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(3, 'Title must be at least 3 characters long')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .min(10, 'Description must be at least 10 characters long'),
  type: z.string({
    required_error: 'Report type is required',
  }),
  images: z.array(z.string()).optional(), // optional images
  relatedTo: z.string().optional(), // optional related ID
});

export const ReportValidation = {
  createReportSchema,
};
