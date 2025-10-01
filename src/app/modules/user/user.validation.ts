import { z } from 'zod';

const createUserZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    email: z.string({ required_error: 'Email is required' }),
    gender: z.enum(['male', 'female']).optional(),
    dateOfBirth: z.string().optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters long').optional(), // Make password optional for OAuth users
    image: z.string().optional(),
    googleId: z.string().optional(), 
  }),
});

const updateUserZodSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  dateOfBirth: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
  image: z.string().optional(),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
};
