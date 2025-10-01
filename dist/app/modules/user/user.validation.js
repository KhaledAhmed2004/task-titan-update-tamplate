"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = void 0;
const zod_1 = require("zod");
const createUserZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Name is required' }),
        email: zod_1.z.string({ required_error: 'Email is required' }),
        gender: zod_1.z.enum(['male', 'female']).optional(),
        dateOfBirth: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters long').optional(), // Make password optional for OAuth users
        image: zod_1.z.string().optional(),
        googleId: zod_1.z.string().optional(),
    }),
});
const updateUserZodSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    email: zod_1.z.string().optional(),
    gender: zod_1.z.enum(['male', 'female']).optional(),
    dateOfBirth: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    password: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
});
exports.UserValidation = {
    createUserZodSchema,
    updateUserZodSchema,
};
