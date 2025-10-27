"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleValidation = void 0;
const zod_1 = require("zod");
const createPrivacyPolicyZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string({ required_error: 'Privacy policy is required' }),
    }),
});
const updatePrivacyPolicyZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().optional(),
    }),
});
const createTermsAndConditionZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string({ required_error: 'Terms and conditions is required' }),
    }),
});
const updateTermsAndConditionZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().optional(),
    }),
});
const createAboutZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string({ required_error: 'About is required' }),
    }),
});
const updaterAboutZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().optional(),
    }),
});
exports.RuleValidation = {
    createPrivacyPolicyZodSchema,
    updatePrivacyPolicyZodSchema,
    createAboutZodSchema,
    updaterAboutZodSchema,
    createTermsAndConditionZodSchema,
    updateTermsAndConditionZodSchema,
};
