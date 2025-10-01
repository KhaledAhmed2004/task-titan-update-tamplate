import z from 'zod';

const createTaskZodSchema = z.object({
  title: z.string({ required_error: 'Title is required' }),
  taskCategory: z.string({ required_error: 'Task category is required' }),
  description: z.string({ required_error: 'Description is required' }),
  taskImage: z.array(z.string()).optional(),
  taskBudget: z.number({ required_error: 'Task budget is required' }),
  taskLocation: z.string({ required_error: 'Task location is required' }),
  latitude: z.number({ required_error: 'Latitude is required' }),
  longitude: z.number({ required_error: 'Longitude is required' }),
});

const updateTaskZodSchema = z.object({
  title: z.string().optional(),
  taskCategory: z.string().optional(),
  description: z.string().optional(),
  taskImage: z.array(z.string()).optional(),
  taskBudget: z.number().optional(),
  taskLocation: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  status: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.string().optional(),
});

const cancelTaskZodSchema = z.object({
  body: z.object({
    reason: z.string({ required_error: 'Cancellation reason is required' })
      .min(1, 'Cancellation reason cannot be empty')
      .max(500, 'Cancellation reason cannot exceed 500 characters'),
  }),
  params: z.object({
    taskId: z.string({ required_error: 'Task ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid task ID format'),
  }),
});

export const TaskValidation = {
  createTaskZodSchema,
  updateTaskZodSchema,
  cancelTaskZodSchema,
};
